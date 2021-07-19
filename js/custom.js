var w = 0;

"use strict";

$(document).ready(function () {
    responsive_dropdown();
});

/* -------- preloader ------- */
$(window).on("load", function () {
    $('#preloader').delay(1000).fadeOut(500);
});

/* -------- preloader End ------- */

/*----- Sticky Header -----*/
$(window).on("scroll", function () {
    if ($(this).scrollTop() > 50) {
        $('header, .top-scroll').addClass('fixed');
    } else {
        $('header, .top-scroll').removeClass('fixed');
    }
});
/*----- Sticky Header End -----*/

/*----- Top scrolling -----*/
$(".scrollTo").on('click', function (e) {
    var target = $(this).attr('href');
    if (window.location.pathname != '/' && target.startsWith("/")) {
        return;
    }

    e.preventDefault();
    if (target.startsWith("/")) {
        target = target.substring(1);
    }

    $('html, body').stop().animate({
        scrollTop: ($(target).offset().top)
    }, 1000);
});
/*----- Top scrolling End -----*/

/* -------- Images Parallax ------- */
if ($(".parallax").length > 0) {
    (function ($) {
        var parallax = -0.5;

        var $bg_images = $(".parallax");
        var offset_tops = [];
        $bg_images.each(function (i, el) {
            offset_tops.push($(el).offset().top);
        });

        $(window).scroll(function () {
            var dy = $(this).scrollTop();
            $bg_images.each(function (i, el) {
                var ot = offset_tops[i];
                $(el).css("background-position", "50% " + (dy - ot) * parallax + "px");
            });
        });
    })(jQuery);
}
if ($(".parallax-2").length > 0) {
    (function ($) {
        var parallax = 0.3;

        var $bg_images = $(".parallax-2");
        var offset_tops = [];
        $bg_images.each(function (i, el) {
            offset_tops.push($(el).offset().top);
        });

        $(window).scroll(function () {
            var dy = $(this).scrollTop();
            $bg_images.each(function (i, el) {
                var ot = offset_tops[i];
                $(el).css("background-position", "50% " + (dy - ot) * parallax + "px");
            });
        });
    })(jQuery);
}
/* -------- Images Parallax ------- */

/*index : Roadmap slider*/
if ($(".roadmap-slider").length > 0) {
    $(".roadmap-slider").owlCarousel({
        loop: false,
        autoplay: false,
        dots: true,
        nav: true,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1,
                loop: false,
                nav: false
            },
            420: {
                items: 2,
                loop: false,
                nav: false,
                margin: 0
            },
            767: {
                items: 3,
                loop: false,
                nav: false,
                margin: 0
            },
            1200: {
                items: 4,
                loop: false,
                nav: false,
                margin: 0
            },
        }
    });
}
/*end Roadmap slider*/

/*Blog slider*/
if ($(".blog-slider").length > 0) {
    $(".blog-slider").owlCarousel({
        loop: true,
        dots: true,
        autoplay: true,
        autoplayTimeout: 5000,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            420: {
                items: 1
            },
            768: {
                items: 2
            },
            1200: {
                items: 3
            },
        }
    });
}
/*end Blog slider*/

/* Team slider*/
if ($(".partners-slider").length > 0) {
    $(".partners-slider").owlCarousel({
        items: 4,
        loop: true,
        margin: 0,
        nav: false,
        responsive: {
            0: {
                dots: true,
                nav: false,
                items: 1
            },
            420: {
                items: 1
            },
            768: {
                items: 3
            },
            992: {
                items: 4
            },
            1200: {
                items: 4
            },
        }
    });
}

/* Tokan Graph */
/*
if ($("#tokensale-part").length > 0) {
    function tokan_graph() {
        var scrollDistance = $(window).scrollTop();
        var scrollDistance1 = $('#tokensale-part').offset().top - 200;

        if (scrollDistance >= (scrollDistance1 - 200) && scrollDistance <= (scrollDistance1 + 200)) {
            $('.donut').listtopie({
                startAngle: 270,
                strokeWidth: 5,
                hoverEvent: true,
                hoverBorderColor: '#6239d7',
                hoverAnimate: false,
                drawType: 'round',
                speedDraw: 250,
                hoverColor: '#ffffff',
                textColor: '#3d1f94',
                strokeColor: '#3d1f94',
                textSize: '0',
                hoverAnimate: true,
                marginCenter: 85,
            });
        }
    }

    $(window).scroll(function () {
        tokan_graph();
    })

    $(window).on("resize", function () {
        $(window).resize(function () {

            if (w != $(window).width()) {
                if (Math.abs($(window).width() - w) > 50) {
                    //$('.donut').listtopie('refresh');
                    w = $(window).width();
                }

            }

        });
    })

    $(".token-graph").addClass("token-graph-right");
}
/* Tokan Graph End */

function responsive_dropdown() {
    /* Responsive Menu */

    $(".menu-toggle").on("click", function () {
        $(".menu-toggle").toggleClass("active");
        $(".menu").slideToggle("slow");
    });


    $(".menu a").on("click", function () {
        if ($(this).hasClass("openerBtn")) {
            return;
        }

        var mq = window.matchMedia("(max-width: 991px)");
        if (mq.matches) {
            $(".menu-toggle").toggleClass("active");
            $(".menu").slideToggle("slow");
        }

    });

    $(".mega-menu > .opener").on("click", function () {
        if ($(this).hasClass("active")) {
            $(this).removeClass("active");
            $(this)
                .siblings(".menu ul ul")
                .slideUp(200);
        } else {
            $(".mega-menu > .opener").removeClass("active");
            $(this).addClass("active");
            $(".menu ul ul").slideUp(200);
            $(this)
                .siblings(".menu ul ul")
                .slideDown(200);
        }
    });

    $(".mega-menu > .openerBtn").on("click", function () {
        var openerPlus = $(this).siblings(".opener");
        if ($(openerPlus).hasClass("active")) {
            $(openerPlus).removeClass("active");
            $(openerPlus)
                .siblings(".menu ul ul")
                .slideUp(200);
        } else {
            $(".mega-menu > .opener").removeClass("active");
            $(openerPlus).addClass("active");
            $(".menu ul ul").slideUp(200);
            $(openerPlus)
                .siblings(".menu ul ul")
                .slideDown(200);
        }
    });
    /* Responsive Menu End */

};



if ($(".coins-progress:not([data-presale='true']):not([data-reward='true'])").length > 0) {
    setInterval(coins_progress, 1000);
    function coins_progress() {
        $(".coins-progress span").each(function () {
            $(this).animate({
                width: $(this).attr("data-progress") + "%",
            }, 1000
            );
            $(this).text($(this).attr("data-progress") + "%");
        });
    };
}

/* -------- Countdown Timer ------- */
if ($(".coins-counter-loop").length > 0) {
    var second = 1000,
        minute = second * 60,
        hour = minute * 60,
        day = hour * 24;

    window.countdown = Date.UTC(2021, 6 - 1, 25, 19, 0, 0);

    setInterval(function () {
        var now = new Date().getTime();
        var distance = window.countdown - now;
        if (distance < 0) {
            distance = 0;
        }

        var daysN = Math.floor(distance / (day));
        var hoursN = Math.floor((distance % (day)) / (hour));
        var minutesN = Math.floor((distance % (hour)) / (minute)); 
        var secondsN = Math.floor((distance % (minute)) / second);

        document.getElementById('days').innerText = daysN < 10 ? "0" + daysN : daysN;
        document.getElementById('hours').innerText = hoursN < 10 ? "0" + hoursN : hoursN;
        document.getElementById('minutes').innerText = minutesN < 10 ? "0" + minutesN : minutesN;
        document.getElementById('seconds').innerText = secondsN < 10 ? "0" + secondsN : secondsN;
    }, second);
}
    /* -------- Countdown Timer End ------- */