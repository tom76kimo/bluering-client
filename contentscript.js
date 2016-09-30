'use strict';

var endPoint = 'https://3fe95389.ngrok.io/user/';
var $userName = document.querySelector('.vcard-username');
var userName = $userName.innerHTML.trim();

var results = [];

function getLastYearDate() {
  var date = new Date();
  var year = date.getFullYear() - 1;
  var month = date.getMonth() + 1;
  return {
    year: year,
    month: month
  }
}

function verifyParts(year, month) {
  var part = 1;
  year -= 2000;
  if (month < 4) {
    part = 1;
  } else if (month < 7) {
    part = 2;
  } else if (month < 10) {
    part = 3;
  } else {
    part = 4;
  }

  return {
    year: year,
    part: part
  };
}

function createContributeElement(title, description, stars) {
  var $elemContainer = document.createElement('li');
  $elemContainer.classList = 'pinned-repo-item p-3 mb-3 border border-gray-dark rounded-1 js-pinned-repo-list-item public source reorderable';

  var $span = document.createElement('span');
  $span.classList = 'pinned-repo-item-content';
  $elemContainer.appendChild($span);

  var $titleSpan = document.createElement('span');
  $titleSpan.classList = 'd-block';

  var $p1 = document.createElement('p');
  $p1.classList = 'pinned-repo-desc text-gray text-small d-block mt-2 mb-3';
  $p1.innerHTML = description;
  var $p2 = document.createElement('p');
  $p2.classList = 'mb-0 f6 text-gray';

  var $a = document.createElement('a');
  $a.classList = 'text-bold mb-2';
  $a.setAttribute('href', '/' + title);

  var $innerTitleSpan = document.createElement('span');
  $innerTitleSpan.classList = 'repo js-repo';
  $innerTitleSpan.innerHTML = title;

  $a.appendChild($innerTitleSpan);
  $titleSpan.appendChild($a);

  var $svg = document.createElement('svg');
  $svg.classList = 'octicon octicon-star';
  $svg.setAttribute('height', 16);
  $svg.setAttribute('width', 14);
  $svg.setAttribute('viewBox', '0 0 14 16');
  $svg.setAttribute('aria-label', 'stars');
  $svg.setAttribute('role', 'img');

  var $path = document.createElement('path');
  $path.setAttribute('d', 'M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74z');

  $svg.appendChild($path);
  $p2.appendChild($svg);
  $svg.insertAdjacentHTML('afterend', stars);

  $span.appendChild($titleSpan);
  $span.appendChild($p1);
  $span.appendChild($p2);

  return $elemContainer;
}

function isTopBorderInViewport ($list, element) {
    if (!element || !element.getBoundingClientRect) {
        return false;
    }
    var rect = element.getBoundingClientRect();
    var listRect = $list.getBoundingClientRect();
    return (
        rect.top <= listRect.bottom &&
        rect.left >= listRect.left &&
        rect.right <= listRect.right
    );
}

function fetchData(year, part) {
  var url = endPoint + userName + '/' + year + '-' + part;
  isFetching = true;
  fetch(url)
      .then(function(response) {
        return response.json()
      }).then(function(json) {
        if (Array.isArray(json)) {
          json.forEach(function (title) {
            $list.insertBefore(createContributeElement(title, 'description...', 1052), $loadingImg);
          });
          renewYearPart();
          isFetching = false;
        }
      }).catch(function(ex) {
        console.log('parsing failed', ex)
        isFetching = false;
      })
}

function renewYearPart() {
  if (part == 1) {
    year -= 1;
    part = 4;
    return;
  }

  part -= 1;
  return;
}

var lastYearDate = getLastYearDate();
var yearParts = verifyParts(lastYearDate.year, lastYearDate.month);

var year = yearParts.year;
var part = yearParts.part;

var imgURL = chrome.extension.getURL('loading.svg');
var $loadingImg = document.createElement('img');
$loadingImg.src = imgURL;
$loadingImg.classList += ' bluering-loading';

var $list = document.querySelector('.pinned-repos-list');
$list.appendChild(createContributeElement('yahoo/fluxible-immutable-utils', 'description...', 1052));
$list.appendChild($loadingImg);

var isFetching = false;

$list.addEventListener('scroll', function (e) {
  if (isTopBorderInViewport($list, $loadingImg) && !isFetching) {
    fetchData(year, part);
  }
});
