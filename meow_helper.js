const sounds = [
    'amzn_sfx_cat_angry_meow_1x_01.mp3',
    'amzn_sfx_cat_angry_meow_1x_02.mp3',
    'amzn_sfx_cat_angry_screech_1x_01.mp3',
    'amzn_sfx_cat_long_meow_1x_01.mp3',
    'amzn_sfx_cat_meow_1x_01.mp3',
    'amzn_sfx_cat_meow_1x_02.mp3',
    'amzn_sfx_cat_purr_meow_01.mp3'
];

const baseUrl = 'https://s3.amazonaws.com/ask-soundlibrary/animals/';

function getMeow() {
    var i = Math.floor(Math.random() * sounds.length);
    var sound = sounds[i];
    return baseUrl + sound;
}

module.exports = getMeow;