function resizeScreen(){
    let reHeight = window.innerHeight * 0.01;
    let reWidth = window.innerWidth * 0.01;
    document.documentElement.style.setProperty('--main-height', `${reHeight}px`);
    document.documentElement.style.setProperty('--main-width', `${reWidth}px`);
}


window.addEventListener('resize', () => {
    resizeScreen();
});


setTimeout(() => {
    resizeScreen();
}, 1000);