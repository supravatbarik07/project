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
        sessionStorage.setItem('lastPage', fileToLoad); // Save the loaded page to sessionStorage
    }
});

// Load the last visited page on page refresh
// document.addEventListener('DOMContentLoaded', () => {
//     const lastPage = sessionStorage.getItem('lastPage');
//     if (lastPage) {
//         iframe.src = lastPage;
//     }
// });

//to meke default page 
document.addEventListener('DOMContentLoaded', () => {
    //const iframe = document.getElementById('content_iframe');
    const lastPage = sessionStorage.getItem('lastPage');
    const defaultPage = iframe.getAttribute('data-default-page');
    // Default to "Meta Token Update" page if no last page is saved
    iframe.src = lastPage || defaultPage;
});

const menuIcon=document.getElementById('menu-icon');

menuIcon.addEventListener('click',()=>{
    menuIcon.classList.toggle('active');
})



// const moon=document.getElementById('moon');

//         moon.addEventListener('click',()=>{
//             document.querySelector('body').classList.toggle('dark-mode')
//         })