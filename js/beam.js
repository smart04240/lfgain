$(window).on("load", function () {
    $('header').css('top', $("#beam").outerHeight() + "px");
});


$("#beamClose").on('click', function () {
    $("#beam").hide();
    $('header').css('top', "0px");
});