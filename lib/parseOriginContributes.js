export default () => {
    const $contributesList = document.querySelectorAll('.pinned-repo-item-content');
    let contributesList = [];

    $contributesList.forEach($entry => {
        const $owner = $entry.querySelector('.owner');
        const $stars = $entry.querySelector('.octicon-star').nextSibling;
        const $language = $entry.querySelector('.pinned-repo-language-color').nextSibling;
        const desc = $entry.querySelector('.pinned-repo-desc').innerHTML;
        let stars = $stars.nodeValue.trim().replace(/\,/g, '');
        stars = parseInt(stars, 10);
        const language = $language.nodeValue.trim();
        let title;
        if ($owner) {
            title = $owner.innerHTML + '/' + $entry.querySelector('.repo').innerHTML;
        } else {
            title = $entry.querySelector('.repo').innerHTML;
        }
        contributesList.push({
            desc,
            title,
            stars,
            language
        });
    });

    return contributesList;
};
