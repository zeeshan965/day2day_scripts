//elsements: ytp-ad-skip-button ytp-button
//copy the script in browser console
setInterval(() => {
    const element = document.querySelector('.ytp-ad-skip-button');
    if(element) element.click();
    console.log(Date.now())
}, 1000)
