(function () {
    var CARD_ORDER = [
        'INTJ', 'INTP', 'ENTJ', 'ENTP',
        'INFJ', 'INFP', 'ENFJ', 'ENFP',
        'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
        'ISTP', 'ISFP', 'ESTP', 'ESFP'
    ]; // Slightly reordered for logical grouping (Analysts, Diplomats, Sentinels, Explorers)

    var CARD_IMAGES = {
        ENFJ: '2.png', ENFP: '3.png', ENTJ: '4.png', ENTP: '5.png',
        ESFJ: '6.png', ESFP: '7.png', ESTJ: '8.png', ESTP: '1.png',
        INFJ: '2.png', INFP: '3.png', INTJ: '4.png', INTP: '5.png',
        ISFJ: '6.png', ISFP: '7.png', ISTJ: '8.png', ISTP: '1.png'
    };

    function createCardMarkup(personality) {
        var imageName = CARD_IMAGES[personality.type] || '1.png';
        
        return `
            <a href="personality-detail.html?type=${personality.type}&result=${personality.type}#${personality.type}" class="personality-card">
                <div class="card-image-wrapper">
                    <img src="./static/img/${imageName}" alt="${personality.type}">
                </div>
                <div class="card-content">
                    <div class="card-type">${personality.type}</div>
                    <div class="card-subtitle">${personality.subtitle || '人格类型'}</div>
                    <p class="card-description">${personality.description || '点击查看详细介绍'}</p>
                    <div class="card-footer">
                        <span class="learn-more">详细介绍 &rarr;</span>
                    </div>
                </div>
            </a>`;
    }

    function renderGrid(personalities) {
        var grid = document.getElementById('grid');
        var personalityMap = personalities.reduce(function (acc, item) {
            acc[item.type] = item;
            return acc;
        }, {});

        grid.innerHTML = CARD_ORDER.filter(function (type) {
            return !!personalityMap[type];
        }).map(function (type) {
            return createCardMarkup(personalityMap[type]);
        }).join('');
    }

    $.getJSON('./data/personality-content.json', function (personalities) {
        renderGrid(personalities);
    }).fail(function () {
        document.getElementById('grid').innerHTML = '<p style="text-align:center; padding: 4rem;">数据加载失败，请重试。</p>';
    });
})();