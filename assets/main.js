// Click/tap on floating head scrolls to intro content, past top padding
document.getElementById("floating-head").addEventListener("click", function() {
    const intro = document.getElementById("intro");
    window.scrollTo({ top: intro.offsetTop, behavior: "smooth" });
});

// Throttle scroll events to one per animation frame
(function() {
    let running = false;
    window.addEventListener("scroll", function() {
        if (running) return;
        running = true;
        requestAnimationFrame(function() {
            window.dispatchEvent(new CustomEvent("optimizedScroll"));
            running = false;
        });
    });
})();

const appears = document.getElementsByClassName("scroll-appear");
const movers = document.getElementsByClassName("scroll-move");
const spinners = document.getElementsByClassName("scroll-spin");
const slowspinners = document.getElementsByClassName("slower-spin");

const goal = 200;
const goal2 = 150;

// JS-side animation state — avoids DOM attribute reads/writes
const appearAnimating = new WeakSet();
const moverAnimating = new WeakSet();

// Keep viewport height current across resizes and mobile chrome show/hide
let windowHeight = window.innerHeight;
window.addEventListener("resize", function() {
    windowHeight = window.innerHeight;
});

window.addEventListener("optimizedScroll", function() {
    for (let i = 0; i < appears.length; i++) {
        const el = appears[i];
        const fromViewportTop = el.getBoundingClientRect().top;
        if (fromViewportTop < windowHeight && fromViewportTop >= windowHeight / 2) {
            el.style.opacity = `${2 - (2 * fromViewportTop / windowHeight)}`;
            el.style.transform = `matrix(1,0,0,1,0,${2 * goal * ((fromViewportTop - windowHeight / 2) / windowHeight)})`;
            appearAnimating.add(el);
        } else if (fromViewportTop < windowHeight / 2 && appearAnimating.has(el)) {
            el.style.opacity = "1";
            el.style.transform = "matrix(1,0,0,1,0,0)";
            appearAnimating.delete(el);
        } else if (appearAnimating.has(el)) {
            el.style.opacity = "0";
            el.style.transform = `matrix(1,0,0,1,0,${goal})`;
            appearAnimating.delete(el);
        }
    }

    for (let i = 0; i < spinners.length; i++) {
        const { top, height } = spinners[i].getBoundingClientRect();
        if (top >= -height) {
            spinners[i].style.transform = `rotate(${window.scrollY}deg)`;
        }
    }

    for (let i = 0; i < slowspinners.length; i++) {
        const { top, height } = slowspinners[i].getBoundingClientRect();
        if (top >= -height && top < windowHeight) {
            slowspinners[i].style.transform = `rotate(${Math.round(window.scrollY / 4)}deg)`;
        }
    }

    for (let i = 0; i < movers.length; i++) {
        const el = movers[i];
        const fromViewportTop = el.getBoundingClientRect().top;
        if (fromViewportTop < windowHeight && fromViewportTop >= windowHeight / 2) {
            el.style.transform = `matrix(1,0,0,1,0,${2 * goal2 * ((fromViewportTop - windowHeight / 2) / windowHeight)})`;
            moverAnimating.add(el);
        } else if (fromViewportTop < windowHeight / 2 && moverAnimating.has(el)) {
            el.style.transform = "matrix(1,0,0,1,0,0)";
            moverAnimating.delete(el);
        } else if (moverAnimating.has(el)) {
            el.style.transform = `matrix(1,0,0,1,0,${goal2})`;
            moverAnimating.delete(el);
        }
    }
});
