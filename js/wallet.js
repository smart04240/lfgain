"use strict";

let isConnected;
let provider; // Chosen wallet provider given by the dialog window

window.addEventListener('load', async () => {
    $("footer").removeClass("skyblue").addClass("darkblue");

    $(".connectedData").hide();
    $(".disconnectedData").show();


    $(".statsLoading").show();

    await initWeb3Custom(true, async function (success) {
        $(".btnConnect").on("click", function () {
            if (!$(this).hasClass("btnConnected")) {
                connect();
            } else {
                disconnect();
            }
        });

        $("#inputWalletAddressSubmit").on("click", async function () {
            var address = $("#inputWalletAddress").val();
            if (!isValidWalletAddress(address)) {
                showLoadAddressDataStatus("Invalid address", true);
                return;
            }

            try {
                await changeWalletAddress(address);
                showLoadAddressDataStatus("Address data loaded successfully!");
            } catch (e) {
                showLoadAddressDataStatus("Unable to load data for this address. Please try again later.", true);
            }
        });

        var address = getParameterByName("address");
        if (address && isValidWalletAddress(address)) {
            $("#inputWalletAddress").val(address);
            await changeWalletAddress(address);
        }

        await refreshAllData();

        setInterval(async function () {
            await refreshAllData();
        }, 15000);
    });


    $("#btnUpdateReinvest").on("click", async function () {
        await updateReinvest();
    });

});


async function refreshAllData() {
    await refreshGlobalData(1);
    updateGlobalData();
    await refreshWalletData(window.walletAddress);
    updateWalletData(false);
}


async function connect() {

    try {
        provider = await window.web3Modal.connect();
    } catch (e) {
        console.log("Could not get a wallet connection", e);
        return;
    }

    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts) => {
        refreshAccount();
    });

    // Subscribe to chainId change
    provider.on("chainChanged", (chainId) => {
        refreshAccount();
    });

    // Subscribe to networkId change
    provider.on("networkChanged", (networkId) => {
        refreshAccount();
    });

    await onConnected();
}

async function disconnect() {
    if (provider.close) {
        await provider.close();

        // If the cached provider is not cleared, WalletConnect will default to the existing session
        // and does not allow to re-scan the QR code with a new wallet.
        await window.web3Modal.clearCachedProvider();
        provider = null;
    }

    window.walletData.selectedAccount = null;
    window.walletXldContract = null;
    await onDisconnected();
}

async function onConnected() {
    $(".btnConnect").addClass("btnConnected");
    $(".connectedData").show();
    $(".disconnectedData").hide();

    await refreshAccount();
}

async function onDisconnected() {
    $(".btnConnect").removeClass("btnConnected");
    $(".btnConnect").text("Connect");
    $(".connectedData").hide();
    $(".disconnectedData").show();
}

async function refreshAccount() {
    var web3 = new Web3(provider);
    var chainIdPromise = web3.eth.getChainId();
    var accountsPromise = web3.eth.getAccounts();
    window.walletXldContract = new web3.eth.Contract(window.xldContractAbi, window.xldContractAddress);

    var chainId = await chainIdPromise;
    if (chainId != 56) {
        // Wrong network
        console.error("Invalid network, expected BSC main network");
        disconnect();
        return;
    }

    // Get selected account and refresh wallet data
    var selectedAccount = (await accountsPromise)[0];
    window.walletData.selectedAccount = selectedAccount;

    if (!selectedAccount) {
        disconnect();
        return;
    }

    
    $(".btnConnect").text(selectedAccount.substring(0, 4) + "..." + selectedAccount.substring(selectedAccount.length - 4));

    await changeWalletAddress(selectedAccount);
}



function updateGlobalData() {
    var currentRewardPool = window.xldData.rewardPool;
    var totalXldBurned = window.xldData.burnAmount;
    var liquidityUSD = window.xldData.liquidityUSD;
    var totalRewardsClaimed = window.xldData.totalBNBClaimed;
    var totalReinvested = window.xldData.totalBNBAsXldClaimed;
    var reservedPool = window.xldData.reservedPool;

    if (!liquidityUSD) {
        liquidityUSD = 0;
    }

    $("#txtRewardPool").text(formatTokenCurrency(currentRewardPool, bnbDecimals));
    $("#txtTotalXldBurned").text(formatTokenCurrency(totalXldBurned, xldDecimals));
    $("#txtLiquidity").text(formatCurrency(liquidityUSD));
    $("#txtTotalRewardsClaimed").text(formatTokenCurrency(totalRewardsClaimed, bnbDecimals));
    $("#txtReservePool").text(formatTokenCurrency(reservedPool, bnbDecimals));
    $("#txtTotalReinvested").text(formatTokenCurrency(totalReinvested, bnbDecimals));

    $(".statsLoading").hide();


    updateCalculatorResults();
}


function getNextAvailableClaimDate() {
    var nextAvailableClaimDate = window.walletData.nextAvailableClaimDate;
    if (!nextAvailableClaimDate) {
        return nextAvailableClaimDate;
    }

    var delay = 60 - nextAvailableClaimDate.getMinutes();
    if (delay >= 59) {
        // Might need some more time until process
        return nextAvailableClaimDate;
    }

    var date = new Date(0);
    date.setUTCSeconds(nextAvailableClaimDate.getTime() / 1000 + delay * 60);
    return date;
}

function getProcessPercentage() {
    var nextAvailableClaimDate = window.walletData.nextAvailableClaimDate;
    if (!nextAvailableClaimDate) {
        return 0;
    }

    var period = window.xldData.rewardCyclePeriod;

    var curDate = new Date();
    var lastClaimDate = new Date(nextAvailableClaimDate.getTime() - period * 1000);
    var newClaimDate = new Date(nextAvailableClaimDate.getTime() + 600 * 1000);
    var hardNewClaimDate = new Date(newClaimDate.getTime() + 20000 * 1000);

   

    var period = newClaimDate.getTime() - lastClaimDate.getTime();

    var passed = curDate.getTime() - lastClaimDate.getTime();
    if (passed < 0) {
        passed = 0;
    }

    var percentage = passed / period * 82;
    if (percentage >= 82) {
        percentage = 82;

        var hardPeriod = hardNewClaimDate.getTime() - newClaimDate.getTime();

        var hardPeriodPassed = curDate.getTime() - newClaimDate.getTime();
        if (hardPeriodPassed < 0) {
            hardPeriodPassed = 0;
        }

        var hardPassedPercentage = hardPeriodPassed / hardPeriod * 100;

        percentage = 82 + 17 * hardPassedPercentage / 100;
    }

    if (percentage > 99.9) {
        percentage = 99.9;
    }

    return percentage;
}

function updateWalletData(isFirstConnect) {
    var bnbReceived = window.walletData.bnbClaimed;
    var sharePercentage = window.walletData.sharePercentage;
    var rewardRate = window.walletData.rewardRate;
    var balance = window.walletData.balanceXld;
    var minRewardBalance = window.xldData.minRewardBalance;
    var reinvestPercentage = window.walletData.reinvestPercentage;
    var processPercentage = getProcessPercentage();


    $("#txtWalletBnbReceived").text(formatTokenCurrency(bnbReceived, 5));
    $("#txtWalletShare").text(sharePercentage.toFixed(4));
    $("#txtWalletRate").text(formatTokenCurrency(rewardRate, 5));
    $("#txtRewardShare").text(sharePercentage + "%");
    $("#txtCollectable").text(formatTokenCurrency(rewardRate, bnbDecimals) + " BNB");
    $("#txtTotalClaimed").text(formatTokenCurrency(bnbReceived, bnbDecimals) + " BNB");
    $("#txtReinvestPercentage").text(reinvestPercentage + "%");

    if (isFirstConnect) {
        $("#txtCalculatorBNB").val(balance);
        $("#txtCalculatorReinvest").val(reinvestPercentage);
        $("#rs-range-line-reinvest").val(reinvestPercentage);
        refreshSliders();
        updateCalculatorResults();
    }


    $(".coins-progress span").each(function () {
        $(this).attr("data-progress", processPercentage);

        if (balance < minRewardBalance) {
            $("#txtCycleProgressPercentage").text("Buy more XLD to start earning!");
        }
        else {
            $("#txtCycleProgressPercentage").text(processPercentage.toFixed(2) + "%");
        }
        
        updatePayoutProgressBar();
    });
}


async function updateReinvest() {
    var prevText = $("#txtUpdateReinvest").text();
    $("#imgLoadingUpdateReinvest").show();
    $("#txtUpdateReinvest").text("Updating");

    var isSuccess = false;
    try {
        var selectedAccount = window.walletData.selectedAccount;
        var percentage = $("#rs-range-line-reinvest").get(0).value;
        await window.walletXldContract.methods.setClaimRewardAsTokensPercentage(percentage).send({ from: selectedAccount });
        isSuccess = true;
    }
    catch (e) {
        showUpdateReinvestError("An error has occurred. Please try again later");
        console.error(e);
    }
    finally {
        $("#imgLoadingUpdateReinvest").hide();
        $("#txtUpdateReinvest").text(prevText);

        await changeWalletAddress(window.walletData.selectedAccount);
        
        if (isSuccess) {
            showUpdateReinvestSuccess("Updated successfully!");
        }
    }
}


async function showUpdateReinvestError(text, isConstant) {
    $("#txtUpdateReinvestStatus").css("color", "#FC4441");
    $("#txtUpdateReinvestStatus").text(text);

    if (isConstant) {
        $("#txtUpdateReinvestStatus").stop().animate({ opacity: 1 }, 400);
    } else {
        $("#txtUpdateReinvestStatus").stop().animate({ opacity: 1 }, 400).delay(5000).animate({ opacity: 0 }, 400);
    }
}

async function showUpdateReinvestSuccess(text) {
    $("#txtUpdateReinvestStatus").css("color", "#F1E080");
    $("#txtUpdateReinvestStatus").text(text);
    $("#txtUpdateReinvestStatus").stop().animate({ opacity: 1 }, 400);
}

function hideUpdateReinvestStatus() {
    $("#txtUpdateReinvestStatus").stop().animate({ opacity: 0 }, 400);
}


async function changeWalletAddress(address) {
    window.walletAddress = address;
    await refreshWalletData(window.walletAddress);
    updateWalletData(true);
    $("#inputWalletAddress").val(address);
    $(".current-selected-address").text(address);
}


function showLoadAddressDataStatus(text, isError) {
    var color = isError ? "#FC4441" : "#F1E080";
    $("#txtLoadAddressDataStatus").css("color", color);
    $("#txtLoadAddressDataStatus").text(text);
    $("#txtLoadAddressDataStatus").stop().animate({ opacity: 1 }, 100);
}



// Calculator

$("#txtCalculatorBNB").on('change input', () => {
    updateCalculatorResults();
});

$("#txtCalculatorReinvest").on('change input', () => {
    updateCalculatorResults();
});


function updateCalculatorResults() {
    var balance = parseFloat($("#txtCalculatorBNB").val().replace(",", ""));
    if (!balance) {
        balance = 0;
    }

    var reinvestPercentage = $("#txtCalculatorReinvest").get(0).value;

    
    var hourlyRewards = projectRewards(balance, reinvestPercentage, 1);

    var dailyRewards = [];
    dailyRewards["bnb"] = hourlyRewards["bnb"] * 24;
    dailyRewards["tokens"] = hourlyRewards["tokens"] * 24;

    var monthlyRewards = [];
    monthlyRewards["bnb"] = dailyRewards["bnb"] * 30;
    monthlyRewards["tokens"] = dailyRewards["tokens"] * 30;

    var yearlyRewards = [];
    yearlyRewards["bnb"] = monthlyRewards["bnb"] * 12;
    yearlyRewards["tokens"] = monthlyRewards["tokens"] * 12;

    $("#txtCalculatorHourlyRewards").text(formatTokenCurrency(hourlyRewards["bnb"], 5));
    $("#txtCalculatorDailyRewards").text(formatTokenCurrency(dailyRewards["bnb"], 5));
    $("#txtCalculatorMonthlyRewards").text(formatTokenCurrency(monthlyRewards["bnb"], 5));
    $("#txtCalculatorYearlyRewards").text(formatTokenCurrency(yearlyRewards["bnb"], 5));

    $("#txtCalculatorHourlyRewardsTokens").text(formatTokenCurrency(hourlyRewards["tokens"]));
    $("#txtCalculatorDailyRewardsTokens").text(formatTokenCurrency(dailyRewards["tokens"]));
    $("#txtCalculatorMonthlyRewardsTokens").text(formatTokenCurrency(monthlyRewards["tokens"]));
    $("#txtCalculatorYearlyRewardsTokens").text(formatTokenCurrency(yearlyRewards["tokens"]));

    /*
    var hourlyRewards = calculateBNBReward(balance, 0) / 24;
    var dailyRewards = hourlyRewards * 24;
    var monthlyRewards = dailyRewards * 30;
    var yearlyRewards = dailyRewards * 365;

    $("#txtCalculatorHourlyRewards").text(hourlyRewards);
    $("#txtCalculatorDailyRewards").text(dailyRewards);
    $("#txtCalculatorMonthlyRewards").text(monthlyRewards);
    $("#txtCalculatorYearlyRewards").text(yearlyRewards);*/
}


function projectRewards(balance, reinvestPercentage, times) {
    var curRewards = [];
    curRewards["bnb"] = 0;
    curRewards["tokens"] = 0;

    for (var i = 0; i < times; i++) {
        var ratedRewards = calculateRewards(balance, reinvestPercentage);
        balance += ratedRewards["tokens"];

        addRewards(curRewards, ratedRewards);
    }

    return curRewards;
}

function calculateRewards(balance, reinvestPercentage) {
    var tokensPerBnb = window.xldData.tokensPerBNB;
    var totalBnbReward = calculateBNBReward(balance);
    var bnbAsTokens = totalBnbReward * reinvestPercentage / 100;
    var bnbReward = totalBnbReward - bnbAsTokens;
    if (bnbReward < 0) {
        bnbReward = 0;
    }

    return {
        "bnb": bnbReward,
        "tokens": bnbAsTokens * tokensPerBnb
    }
}

function addRewards(a, b) {
    a["bnb"] += b["bnb"];
    a["tokens"] += b["tokens"];
}

function calculateBNBReward(balance) {
    var currentRewardPool = window.xldData.rewardPool;
    var globalRewardDampeningPercentage = window.xldData.globalRewardDampeningPercentage;
    var mainPoolSize = window.xldData.mainPoolSize;
    var maxClaimAllowed = window.xldData.maxClaimAllowed;
    var totalTokensHeld = window.xldData.totalTokensHeld;

    var bnbPool = currentRewardPool * (100 - globalRewardDampeningPercentage) / 100;
    if (bnbPool > mainPoolSize) {
        bnbPool = mainPoolSize;
    }

    var reward = bnbPool * balance / totalTokensHeld;
    if (reward > maxClaimAllowed) {
        reward = maxClaimAllowed;
    }

    return reward;

}





// Sliders //
$(".rs-range-line").on('change input', function () {
    showSliderValue($(this).get(0));
});

function refreshSliders() {
    $(".rs-range-line").each(function (index, value) {
        showSliderValue($(value).get(0));
    });

    refreshCalculatorSlider();
}

function showSliderValue(rangeSlider) {
    var rangeBullet = $(rangeSlider).siblings('.rs-bullet')[0];

    rangeBullet.innerHTML = rangeSlider.value;
    var bulletPosition = (rangeSlider.value / rangeSlider.max);
    var width = rangeSlider.offsetWidth;
    rangeBullet.style.left = (bulletPosition * (width - 22)) + "px";

    var boxMinMax = $(rangeSlider).parent().siblings(".box-minmax");
    if (boxMinMax.length > 0) {
        $(boxMinMax).find(".fadexld").css("opacity", 0.2 + 0.8 * rangeSlider.value / 100);
        $(boxMinMax).find(".fadebnb").css("opacity", 0.2 + 0.8 * (100 - rangeSlider.value) / 100);
        $(boxMinMax).find(".rs-cur-value").text(rangeSlider.value);
    }

    if ($(rangeSlider).attr('id') == 'rs-range-line-reinvest') {
        $("#reinvestInfo").text(rangeSlider.value + "%");
    }
}

$("#txtCalculatorReinvest").on('change input', function () {
    refreshCalculatorSlider();
});

function refreshCalculatorSlider() {
    var calcValue = $("#txtCalculatorReinvest").get(0).value;
    $("#txtCalculatorReinvest").siblings('p').text(calcValue + "%");
}


$(window).on('resize', function () {
    refreshSliders();
});


function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function updatePayoutProgressBar() {
    $(".coins-progress span").each(function () {
        $(this).animate({
            width: $(this).attr("data-progress") + "%",
        }, 500
        );
        $(this).text($(this).attr("data-progress") + "%");
    });
};