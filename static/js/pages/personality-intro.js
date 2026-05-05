$(document).ready(function () {

    // 这个脚本控制详情页首屏到正文的展开动画，并兼顾旧版 IE 的兼容判断。
    var ie = (function () {
        var undef, rv = -1; // Return value assumes failure.
        var ua = window.navigator.userAgent;
        var msie = ua.indexOf('MSIE ');
        var trident = ua.indexOf('Trident/');

        if (msie > 0) {
            // IE 10 or older => return version number
            rv = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        } else if (trident > 0) {
            // IE 11 (or newer) => return version number
            var rvNum = ua.indexOf('rv:');
            rv = parseInt(ua.substring(rvNum + 3, ua.indexOf('.', rvNum)), 10);
        }

        return ((rv > -1) ? rv : undef);
    }());


    // 在首屏阶段暂时锁定滚动，避免用户还没展开正文就把页面滚走。
    var keys = [32, 37, 38, 39, 40], wheelIter = 0;

    function preventDefault(e) {
        e = e || window.event;
        if (e.preventDefault)
            e.preventDefault();
        e.returnValue = false;
    }

    function keydown(e) {
        for (var i = keys.length; i--;) {
            if (e.keyCode === keys[i]) {
                preventDefault(e);
                return;
            }
        }
    }

    function touchmove(e) {
        preventDefault(e);
    }

    function wheel(e) {
        // for IE
        //if( ie ) {
        //preventDefault(e);
        //}
    }

    function disable_scroll() {
        window.onmousewheel = document.onmousewheel = wheel;
        document.onkeydown = keydown;
        document.body.ontouchmove = touchmove;
    }

    function enable_scroll() {
        window.onmousewheel = document.onmousewheel = document.onkeydown = document.body.ontouchmove = null;
    }

    var docElem = window.document.documentElement,
        scrollVal,
        isRevealed,
        noscroll,
        isAnimating,
        container = document.getElementById('article'),
        trigger = container.querySelector('button.trigger');

    function scrollY() {
        // 统一读取当前滚动值，兼容不同浏览器的实现差异。
        return window.pageYOffset || docElem.scrollTop;
    }

    function scrollPage() {
        scrollVal = scrollY();

        if (noscroll && !ie) {
            if (scrollVal < 0) return false;
            // keep it that way
            window.scrollTo(0, 0);
        }

        if (classie.has(container, 'notrans')) {
            classie.remove(container, 'notrans');
            return false;
        }

        if (isAnimating) {
            return false;
        }

        if (scrollVal <= 0 && isRevealed) {
            toggle(0);
        }
        else if (scrollVal > 0 && !isRevealed) {
            toggle(1);
        }
    }

    function toggle(reveal) {
        // modify 类名决定文章是否进入“正文展开”状态。
        isAnimating = true;

        if (reveal) {
            classie.add(container, 'modify');
        }
        else {
            noscroll = true;
            disable_scroll();
            classie.remove(container, 'modify');
        }

        // simulating the end of the transition:
        setTimeout(function () {
            isRevealed = !isRevealed;
            isAnimating = false;
            if (reveal) {
                noscroll = false;
                enable_scroll();
            }
        }, 600);
    }

    // 刷新后如果页面已经有滚动位置，就直接恢复到展开态，避免视觉闪烁。
    var pageScroll = scrollY();
    noscroll = pageScroll === 0;

    disable_scroll();

    if (pageScroll) {
        isRevealed = true;
        classie.add(container, 'notrans');
        classie.add(container, 'modify');
    }

    window.addEventListener('scroll', scrollPage);
    trigger.addEventListener('click', function () { toggle('reveal'); });

});