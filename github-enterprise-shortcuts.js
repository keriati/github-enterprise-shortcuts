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
    }

    function onLineSelectKey(event) {
        var actions = {
            j: selectNextLine,
            k: selectPrevLine,
            o: commentSelectedLine,
        };

        try {
            actions[event.key]();
            event.preventDefault();
        } catch (e) {

        }
    }

    function selectNextLine() {
        console.log('select next line');
        var lines = getCodeLines();

        var selectedLineIndex = getSelectedLineIndex(lines);

        deselectLineAtIndex(lines, selectedLineIndex);

        if (selectedLineIndex === lines.length - 1) {
            selectedLineIndex = -1;
        }

        selectLineAtIndex(lines, selectedLineIndex + 1);
    }

    function selectPrevLine() {
        var lines = getCodeLines();

        var selectedLineIndex = getSelectedLineIndex(lines);

        deselectLineAtIndex(lines, selectedLineIndex);

        if (selectedLineIndex < 1) {
            selectedLineIndex = lines.length;
        }

        selectLineAtIndex(lines, selectedLineIndex - 1);
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
