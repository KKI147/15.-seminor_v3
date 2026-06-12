function contentScript(_idx, _content) {
    contentsIdx = _idx;
    contents = _content;

    switch (contentsIdx) {
        case 0:
            /* common popscale — #wrap visibility 이후 게임 초기화 */
            bindWrapResize();
            waitWrapReady(function () {
                DefenseDemo.init(_content);
            });
            break;
    }
}

/** #wrap 표시·popscale(FORTEACHERCD.responsive) 스케일 적용 후 콜백 */
function waitWrapReady(callback) {
    let tries = 0;
    const maxTries = 50;

    function isWrapScaled() {
        const wrap = document.getElementById('wrap');
        if (!wrap || wrap.style.visibility === 'hidden') {
            return false;
        }
        if (typeof FORTEACHERCD !== 'undefined' && FORTEACHERCD.responsive) {
            return FORTEACHERCD.responsive.baseContainerSize.zoom > 0;
        }
        return wrap.style.transform && wrap.style.transform.indexOf('scale') >= 0;
    }

    function check() {
        tries++;

        if (isWrapScaled()) {
            callback();
            return;
        }
        if (tries >= maxTries) {
            callback();
            return;
        }
        setTimeout(check, 100);
    }

    check();
}

/** 창 리사이즈 시 common popscale 이 #wrap 스케일을 갱신함 — 게임은 1920×1020 내부 좌표 유지 */
function bindWrapResize() {
    let resizeTimer = null;

    function onResize() {
        if (resizeTimer) {
            clearTimeout(resizeTimer);
        }
        resizeTimer = setTimeout(function () {
            resizeTimer = null;
            if (typeof FORTEACHERCD === 'undefined' || !FORTEACHERCD.responsive) {
                return;
            }
            const wrap = document.getElementById('wrap');
            if (!wrap) {
                return;
            }
            FORTEACHERCD.responsive.currentContainerSize.containerWidth =
                window.innerWidth || document.documentElement.clientWidth;
            FORTEACHERCD.responsive.currentContainerSize.containerHeight =
                window.innerHeight || document.documentElement.clientHeight;
            FORTEACHERCD.responsive.setScaleElement(wrap);
        }, 200);
    }

    window.addEventListener('resize', onResize, false);
}
