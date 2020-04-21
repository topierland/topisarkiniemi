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

const windowHeight = window.innerHeight;
const appears = document.getElementsByClassName("scroll-appear");
const movers = document.getElementsByClassName("scroll-move");
const goal = 200;
const goal2 = 150;
const spinners = document.getElementsByClassName("scroll-spin");
const slowspinners = document.getElementsByClassName("slower-spin");

// Scroll settings
window.addEventListener("optimizedScroll", function(){
    for (let i = 0; i < appears.length; i++) {
        let fromViewportTop = appears[i].getBoundingClientRect().top;
        if (fromViewportTop < windowHeight && fromViewportTop >= windowHeight / 2) {
            appears[i].style.opacity = "" + 2 - ( 2 * fromViewportTop / windowHeight ) + "";
            appears[i].style.transform = "matrix(1,0,0,1,0," + 2 * goal * ( (fromViewportTop - windowHeight / 2) / windowHeight ) + ")";
            appears[i].setAttribute("animate", "true");
        } else if (fromViewportTop < windowHeight / 2 && appears[i].getAttribute("animate") === "true") {
            appears[i].style.opacity = "1";
            appears[i].style.transform = "matrix(1,0,0,1,0,0)";
            appears[i].setAttribute("animate", "false");
        } else if (appears[i].getAttribute("animate") === "true") {
            appears[i].style.opacity = "0";
            appears[i].style.transform = "matrix(1,0,0,1,0," + goal + ")";
            appears[i].setAttribute("animate", "false");
        }
    }
    for (let i = 0; i < spinners.length; i++) {
        let fromViewportTop = spinners[i].getBoundingClientRect().top;
        let elementHeight = spinners[i].getBoundingClientRect().height;
        if (fromViewportTop >= - elementHeight) {
            spinners[i].style.transform = "rotate(" + window.pageYOffset + "deg)";
        }
    }
    for (let i = 0; i < slowspinners.length; i++) {
        let fromViewportTop = slowspinners[i].getBoundingClientRect().top;
        let elementHeight = slowspinners[i].getBoundingClientRect().height;
        if (fromViewportTop >= - elementHeight && fromViewportTop < windowHeight) {
            slowspinners[i].style.transform = "rotate(" + Math.round( window.pageYOffset / 4 ) + "deg)";
        }
    }
    for (let i = 0; i < movers.length; i++) {
        let fromViewportTop = movers[i].getBoundingClientRect().top;
        if (fromViewportTop < windowHeight && fromViewportTop >= windowHeight / 2) {
            movers[i].style.transform = "matrix(1,0,0,1,0," + 2 * goal2 * ( (fromViewportTop - windowHeight / 2) / windowHeight ) + ")";
            movers[i].setAttribute("animate", "true");
        } else if (fromViewportTop < windowHeight / 2 && movers[i].getAttribute("animate") === "true") {
            movers[i].style.transform = "matrix(1,0,0,1,0,0)";
            movers[i].setAttribute("animate", "false");
        } else if (movers[i].getAttribute("animate") === "true") {
            movers[i].style.transform = "matrix(1,0,0,1,0,"+ goal2 + ")";
            movers[i].setAttribute("animate", "false");
        }
    }
});