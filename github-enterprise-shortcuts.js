// ==UserScript==
// @name         Github Enterprise Keyboard Shortcuts for Pull Requests
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  For faster code reviews!
// @author       Attila Kerekes
// @match        https://github.*.*/*
// @grant        none
// ==/UserScript==

let getPathName = function () {
    return document.location.pathname;
};
(function () {
    'use strict';
    createSelectedStyle();
    addKeyBindings();

    function createSelectedStyle() {
        var node = document.createElement('style');
        node.innerHTML = '.diff-table tr.selected td { background-color: rgba(0,0,0,0.1) }';
        document.body.appendChild(node);
    }

    function addKeyBindings() {
        var actions = {
            g: enterCommandMode,
        };

        document.addEventListener('keydown', function (event) {
            try {
                actions[event.key]();
            } catch (e) {

            }
        });
    }

    function enterCommandMode() {
        document.addEventListener('keydown', onCommandKey);
        setTimeout(function () {
            try {
                exitCommandMode();
            } catch (e) {

            }
        }, 2000);
    }

    function onCommandKey(event) {
        var actions = {
            f: showPullRequestFiles,
            r: openReviewWindow,
            m: focusMergePullRequestButton,
            b: copyBranchName,
            v: enterLineSelectMode,
        };

        try {
            actions[event.key]();
            event.preventDefault();
        } catch (e) {

        }

        exitCommandMode();
    }

    function exitCommandMode() {
        document.removeEventListener('keydown', onCommandKey);
    }

    function openReviewWindow() {
        var pathName = document.location.pathname;

        if (isPullRequestFilesPath(pathName)) {
            clickReviewButton();
            focusReviewMessageBox();
        }
    }

    function isPullRequestFilesPath(pathName) {
        return /pull\/\d*\/files$/.test(pathName);
    }

    function clickReviewButton() {
        document.querySelectorAll('.js-reviews-container .btn-primary')[0].click();
    }

    function focusReviewMessageBox() {
        document.querySelectorAll('#pull_request_review_body')[0].focus();
    }

    function setPathName(pathname) {
        document.location.pathname = pathname;
    }

    function showPullRequestFiles() {
        var pathName = getPathName();

        if (isPullRequestPath(pathName)) {
            setPathName(getPullRequestRootPath(pathName) + '/files');
        }
    }

    function isPullRequestPath(pathName) {
        return /pull/.test(pathName);
    }

    function getPullRequestRootPath(pathName) {
        return pathName
            .split('/')
            .slice(0, 5)
            .join('/');
    }

    function focusMergePullRequestButton() {
        var pathName = getPathName();

        if (isPullRequestPath(pathName)) {
            document.querySelectorAll('button[data-details-container=".js-merge-pr"]')[2].focus();
        }
    }

    function copyBranchName() {
        navigator.clipboard.writeText(getBranchName());
    }

    function getBranchName() {
        return document.querySelectorAll('.commit-ref')[1].title.split(':')[1];
    }

    function enterLineSelectMode() {
        document.addEventListener('keydown', onLineSelectKey);
    }

    function exitLineSelectMode() {
        document.removeEventListener('keydown', onLineSelectKey);
        var lines = getCodeLines();

        var selectedLineIndex = getSelectedLineIndex(lines);

        deselectLineAtIndex(lines, selectedLineIndex);
    }

    function onLineSelectKey(event) {
        var actions = {
            j: selectNextLine,
            J: jump10LinesForwards,
            k: selectPrevLine,
            K: jump10LinesBackwards,
            o: commentSelectedLine,
            g: exitLineSelectMode
    };

        try {
            actions[event.key]();
            event.preventDefault();
        } catch (e) {

        }
    }

    function selectNextLine() {
        jumpForwardLines();
    }

    function jump10LinesForwards() {
        jumpForwardLines(10);
    }

    function selectPrevLine() {
        jumpForwardLines(-1);
    }

    function jump10LinesBackwards() {
        jumpForwardLines(-10);
    }


    function jumpForwardLines(linesToJump) {
        linesToJump = linesToJump || 1;
        var lines = getCodeLines();

        var selectedLineIndex = getSelectedLineIndex(lines);

        deselectLineAtIndex(lines, selectedLineIndex);

        if (linesToJump < 0 && selectedLineIndex < -1 * linesToJump) {
            selectedLineIndex = lines.length;
            linesToJump = -1;
        }

        if (linesToJump > 0 && selectedLineIndex  + linesToJump > lines.length - 1) {
            selectedLineIndex = -1;
            linesToJump = 1;
        }

        let newSelectionIndex = selectedLineIndex + linesToJump;

        selectLineAtIndex(lines, newSelectionIndex);
        scrollToElement(lines, newSelectionIndex);
    }

    function scrollToElement(lines, newSelectionIndex) {
        var selectedLine = lines[newSelectionIndex];
        if (!isElementInViewport(selectedLine)) {
            selectedLine.scrollIntoView({
                behavior: 'instant',
                block: 'center',
                inline: 'nearest',
            });
        }
    }

    function isElementInViewport(el) {
        var rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document. documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document. documentElement.clientWidth)
        );
    }

    function getSelectedLineIndex(lines) {
        return Array.prototype.indexOf.call(lines, getSelectedLine(lines));
    }

    let getSelectedLine = function (lines) {
        return Array.prototype.find.call(lines, isSelectedLine);
    };

    function isSelectedLine(line) {
        return line.className === 'selected';
    }

    function getCodeLines() {
        return document.querySelectorAll('.diff-table tr:not(.js-expandable-line):not(.inline-comments)');
    }

    function deselectLineAtIndex(lines, selectedLineIndex) {
        var line = lines[selectedLineIndex];

        if (!line) {
            return;
        }

        line.classList.remove('selected');
    }

    function selectLineAtIndex(lines, number) {
        console.log('select', lines[number]);
        lines[number].classList.add('selected');
    }

    function commentSelectedLine() {
        document.querySelectorAll('tr.selected .add-line-comment')[0].click();
        exitLineSelectMode();
    }
})();
