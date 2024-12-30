const option_menu = document.getElementById('option_menu');
const options = document.getElementById('options');
const iframe = document.getElementById('content_iframe');

// Show/hide dropdown menu
option_menu.addEventListener('mouseover', () => {
    options.classList.remove('invisible');
    options.classList.add('visible');
});

option_menu.addEventListener('mouseout', () => {
    options.classList.remove('visible');
    options.classList.add('invisible');
});

options.addEventListener('mouseover', () => {
    options.classList.remove('invisible');
    options.classList.add('visible');
});

options.addEventListener('mouseout', () => {
    options.classList.remove('visible');
    options.classList.add('invisible');
});

// Handle iframe loading
options.addEventListener('click', (event) => {
    event.preventDefault();
    const fileToLoad = event.target.getAttribute('data-file');
    if (fileToLoad) {
        iframe.src = fileToLoad;
    }
});
