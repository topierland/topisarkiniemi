// Scroll function
(function(){
    let throttle = function(type, name, obj){
        let object = obj || window;
        let running = false;
        let func = function(){
            if (running){ return; }
            running = true;
            requestAnimationFrame(function(){
                object.dispatchEvent(new CustomEvent(name));
                running = false;
            });
        };
        object.addEventListener(type, func);
    };
    throttle("scroll", "optimizedScroll");
})();

// Scroll elements
const sections = document.getElementsByClassName("scroll-appear");
const goal = 150;
const windowHeight = window.innerHeight;

// Scroll settings
window.addEventListener("optimizedScroll", function(){
    for (let i = 0; i < sections.length; i++) {
        let fromViewportTop = sections[i].getBoundingClientRect().top;
        if (fromViewportTop < windowHeight && fromViewportTop >= windowHeight / 2) {
            sections[i].style.opacity = "" + 2 - ( 2 * fromViewportTop / windowHeight ) + "";
            sections[i].style.transform = "matrix(1,0,0,1,0," + 2 * goal * ( (fromViewportTop - windowHeight / 2) / windowHeight ) + ")";
        } else if (fromViewportTop < windowHeight / 2) {
            sections[i].style.opacity = "1";
            sections[i].style.transform = "matrix(1,0,0,1,0,0)";
        } else {
            sections[i].style.opacity = "0";
            sections[i].style.transform = "matrix(1,0,0,1,0,150)";
        }
    }
});