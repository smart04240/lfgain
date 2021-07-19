
$(window).on("load", function () {
    initMerch();


    $('.gallery').on('click', '.filter_container > div', function () {
        $('.filter_container > div').removeClass('active');
        $(this).addClass('active');
    });

    if ($('.item_container').length) {
        var itemGrid = new Muuri('.item_container', {
            showDuration: 200,
            hideDuration: 100,
            showEasing: 'ease-out',
            layout: {
                rounding: false
            }
        });

        $('.filter_container .filter-item').on('click', function () {
            var filterClass = $(this).data('filter');
            if (filterClass === 'all') {
                itemGrid.filter('.item');
            }
            else {
                itemGrid.filter('.' + filterClass);
            }
        });
    }

    $('.product-listing-carousel').owlCarousel({
        loop: true,
        margin: 0,
        nav: true,
        dots: false,

        responsive: {
            0: {
                items: 1
            },
            600: {
                items: 1
            },
            1000: {
                items: 1
            }
        }
    });


    $(".owl-prev").html('<div class="navigation-link-prev"><a class="prev-btn"><i class="fas fa-chevron-left"></i> </a></div>');
    $(".owl-next").html('<div class="navigation-link-next"><a class="next-btn"><i class="fas fa-chevron-right"></i> </a></div>');
});

function initMerch() {
    add(["hat_white_01", "hat_white_02"], ["hats"], "Hat (White)");
    add(["hat_black_01", "hat_black_02"], ["hats"], "Hat (Black)");

    add(["mug_02", "mug_01"], ["other"], "Mug");

    add(["socks_02", "socks_01"], ["socks"], "Socks");

    add(["sweatshirt_01", "sweatshirt_02"], ["shirts"], "Sweatshirt");
    add(["tshirt_fem_black_01"], ["shirts"], "T-shirt (Female)");
    add(["tshirt_male_white_01"], ["shirts"], "T-shirt (Male)");
    add(["tanktop_01"], ["shirts"], "Tanktop");
}


function add(imgs, categories, title) {
    var prototype = $(".item_prototype");
    var imgPrototype = $(".img_prototype");

    var item = $(prototype).clone();
    item.removeClass("item_prototype");

    var carousel = item.find(".product-listing-carousel");
   

    // Add categories
    for (var i = 0; i < categories.length; i++) {
        $(item).addClass(categories[i]);
    }

    // Add images
    for (var i = 0; i < imgs.length; i++) {
        var imgDiv = $(imgPrototype).clone();
        imgDiv.removeClass("img_prototype");
        $(imgDiv).css("display", "block");

        //$(imgDiv).find(".owl-lazy").attr("data-src", imgs[i]);
        $(imgDiv).find(".owl-image").addClass(imgs[i]);

        
        $(carousel).append(imgDiv);
    }

    $(item).find(".item-desc-title").text(title);


    $(item).css("display", "block");
    $(".item_container").append(item);
}
