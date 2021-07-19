// Unpkg imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;
const BinanceWallet = window.BinanceChain;

const xldDecimals = 9;
const wbnbDecimals = 18;
const bnbDecimals = 18;
const usdDecimals = 18;
const isTest = false;

async function initWeb3Custom(initModal, onLoad) {
    window.xldData = [];
    window.usdData = [];
    window.bnbData = [];
    window.walletData = [];
    resetWalletData();

    window.xldContractAddress = "0xDaf4F11947E73f0eeBEf4a820f4Be9B854aa993B";
    window.burnAddress = "0x000000000000000000000000000000000000dead";

    window.web3Global = new Web3("https://winter-long-log.bsc.quiknode.pro/3503012e0da697ff7136c68d5d0f618eceb2da1a/");
    await initContractABIs(onLoad);

    if (initModal) {
        initWeb3Modal();
    }
}


async function initContractABIs(onLoad) {
    // Load XLD contract ABI
    $.get('/contractxld.json', function (abi) {
        window.xldContractAbi = abi;
        window.xldContract = new window.web3Global.eth.Contract(abi, window.xldContractAddress);
    });


    // Load PancakeSwap contract ABI
    $.get('/pancakeSwapContract.json', async function (abi) {
        var pancakeSwapContractAddress = "0xca143ce32fe78f1f7019d7d551a6402fc5350c73";
        var wbnbContractAddress = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
        var bnbUsdPairAddress = "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16";

        window.pancakeSwapContract = new window.web3Global.eth.Contract(abi, pancakeSwapContractAddress);

        // Load Pair contract ABI
        try {
            var pair = await window.pancakeSwapContract.methods.getPair(wbnbContractAddress, window.xldContractAddress).call();
            $.get('/pair.json', async function (abi) {
                window.bnbXldPairContract = new window.web3Global.eth.Contract(abi, pair);
                window.bnbUsdPairContract = new window.web3Global.eth.Contract(abi, bnbUsdPairAddress);

                await refreshGlobalData(1);
                if (onLoad) {
                    onLoad(true);
                }
            });
        }
        catch (e) {
            if (onLoad) {
                onLoad(false);
            }
        }
    });
}


async function refreshGlobalData() {
    return new Promise((resolve, reject) => {
        $.get('/Web3/Data', async function (data) {
            window.bnbData.priceUSD = data.bnbPriceUSD;
            window.xldData.tokensPerBNB = data.tokensPerBNB;
            window.xldData.liquidityBNB = data.liquidityBNB;
            window.xldData.liquidityUSD = window.xldData.liquidityBNB * window.bnbData.priceUSD;
            window.xldData.totalTokensHeld = data.totalTokensHeld;
            window.xldData.totalSupply = data.totalSupply;
            window.xldData.rewardPool = data.rewardPool;
            window.xldData.rewardPoolUSD = window.xldData.rewardPool * window.bnbData.priceUSD;
            window.xldData.burnAmount = data.burnAmount;
            window.xldData.burnAmountUSD = window.xldData.burnAmount * window.bnbData.priceUSD;
            window.xldData.totalBNBClaimed = data.totalBNBClaimed;
            window.xldData.totalBNBClaimedUSD = window.xldData.totalBNBClaimed * window.bnbData.priceUSD;
            window.xldData.totalBNBAsXldClaimed = data.totalBNBAsXLDClaimed;
            window.xldData.totalBNBAsXldClaimedUSD = window.xldData.totalBNBAsXldClaimed * window.bnbData.priceUSD;
            window.xldData.minRewardBalance = data.minRewardBalance;
            window.xldData.globalRewardDampeningPercentage = data.globalRewardDampeningPercentage;
            window.xldData.mainPoolSize = data.mainPoolSize;
            window.xldData.maxClaimAllowed = data.maxClaimAllowed;
            window.xldData.rewardCyclePeriod = data.rewardCyclePeriod;
            window.xldData.reservedPool = Math.max(0, window.xldData.rewardPool - window.xldData.mainPoolSize);

            resolve(data);
        });
    });
}

async function refreshWalletData(walletAddress) {
    if (!walletAddress) {
        return;
    }

    walletAddress = walletAddress.trim();
    if (!isValidWalletAddress(walletAddress)) {
        return;
    }

    var contract = window.xldContract;
    if (window.walletXldContract) {
        contract = window.walletXldContract;
    } 

    var bnbClaimedPromise = contract.methods.bnbRewardClaimed(walletAddress).call();
    var bnbClaimedAsXldPromise = contract.methods.bnbRewardClaimedAsXLD(walletAddress).call();
    var balanceXldPromise = contract.methods.balanceOf(walletAddress).call();
    var rewardRatePromise = contract.methods.calculateBNBReward(walletAddress).call();
    var reinvestPercentagePromise = contract.methods.claimRewardAsTokensPercentage(walletAddress).call();
    var nextAvailableClaimDatePromise = contract.methods.nextAvailableClaimDate(walletAddress).call();


    window.walletData.bnbClaimed = (await bnbClaimedPromise) / Math.pow(10, bnbDecimals);
    window.walletData.bnbClaimedAsXld = (await bnbClaimedAsXldPromise) / Math.pow(10, bnbDecimals);
    window.walletData.balanceXld = (await balanceXldPromise) / Math.pow(10, xldDecimals);
    window.walletData.rewardRate = (await rewardRatePromise) / Math.pow(10, bnbDecimals);
    window.walletData.sharePercentage = window.walletData.balanceXld / window.xldData.totalSupply * 100;
    window.walletData.reinvestPercentage = await reinvestPercentagePromise;


    // Next available claim date
    var secondsSinceEpoch = await nextAvailableClaimDatePromise;
    var date = new Date(0);
    date.setUTCSeconds(secondsSinceEpoch);
    window.walletData.nextAvailableClaimDate = date;
}

function resetWalletData() {
    window.walletData.bnbClaimed = 0;
    window.walletData.bnbClaimedAsXld = 0;
    window.walletData.balanceXld = 0;
    window.walletData.rewardRate = 0;
    window.walletData.sharePercentage = 0;
    window.walletData.reinvestPercentage = 0;
    window.walletData.nextAvailableClaimDate = null;
}



function initWeb3Modal() {
    const providerOptions = {
        walletconnect: {
            package: WalletConnectProvider,
            options: {
                rpc: {
                    56: 'https://bsc-dataseed.binance.org/'
                },
                network: 'binance',
            }
        },

        walletconnect: {
            package: WalletConnectProvider,
            options: {
                rpc: {
                    56: 'https://bsc-dataseed.binance.org/'
                },
                network: 'binance',
            }
        },

        "custom-binance": {
            display: {
                logo: "images/binance_wallet.png",
                name: "Binance Chain Wallet",
                description: "Connect to your Binance Chain Wallet"
            },
            package: window.BinanceChain,
            options: {

            },
            connector: async (ProviderPackage, options) => {
                await window.BinanceChain.enable()
                return window.BinanceChain;
            }
        }
    };

    window.web3Modal = new Web3Modal({
        cacheProvider: false, // optional
        providerOptions, // required
        disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
        theme: "dark"
    });
}


function formatTokenCurrency(value, decimals) {
    if (!value) {
        value = 0;
    }

    value = value.toFixed(decimals);

    if (value.indexOf('.') === -1) {
        return value;
    }

    while ((value.slice(-1) === '0' || value.slice(-1) === '.') && value.indexOf('.') !== -1) {
        value = value.substr(0, value.length - 1);
    }
    return value;
}



function formatCurrency(value) {
    return '$' + parseFloat(value, 10).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,").toString();
}


function getTimespanDescription(date) {
    var currentDate = new Date();
    var seconds = (date.getTime() - currentDate.getTime()) / 1000;

    var d = Number(seconds);
    var h = Math.round(d / 3600);

    if (h > 0) {
        var days = Math.round(h / 24);
        if (days >= 3) {
            return days + " days";
        }

        if (h == 25) { h = 24;}
        return h + (h == 1 ? " hour" : " hours");
    }

    var m = Math.round(d % 3600 / 60);
    if (m > 0) {
        return m + (m == 1 ? " minute" : " minutes");
    }

    var s = Math.round(d % 3600 % 60);
    return s + (s == 1 ? " second" : " seconds");
}




function isValidWalletAddress(address) {
    return window.web3Global.utils.isAddress(address);
}
