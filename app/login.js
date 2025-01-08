let id = $('#id');
let pw = $('#pw');
let btn = $('#btn');

$(btn).on('click', function() {
    if($(id).val() == "") {
        $(id).next('label').addClass('warning');
        setTimeout(function() {
            $('label').removeClass('warning');
        },1500);
    }
    else if($(pw).val() == "") {
        $(pw).next('label').addClass('warning');
        setTimeout(function() {
            $('label').removeClass('warning');
        },1500);
    }
});

document.getElementById('signup-link').addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('signup-modal').style.display = 'flex';
});

document.getElementById('close-btn').addEventListener('click', function () {
    document.getElementById('signup-modal').style.display = 'none';
});