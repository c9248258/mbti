(function (global) {
    // MBTI 四个维度对应的合法答案值，后续会用它做输入校验。
    var VALID_TYPES = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
    // 每两个字母构成一个对立维度，最终结果从每组里选出现次数更多的一项。
    var TYPE_PAIRS = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];

    function validateAnswers(answerList) {
        if (!Array.isArray(answerList) || answerList.length === 0) {
            throw new Error('answer list is empty');
        }

        answerList.forEach(function (item) {
            if (!item || VALID_TYPES.indexOf(item.v) === -1) {
                throw new Error('answer type is not in supported types');
            }
        });
    }

    function calculatePersonalityType(answerList) {
        validateAnswers(answerList);

        var counts = answerList.reduce(function (accumulator, current) {
            var val = current.v;
            var weight = current.w || 1;
            accumulator[val] = (accumulator[val] || 0) + weight;
            return accumulator;
        }, {});

        return TYPE_PAIRS.map(function (pair) {
            var score1 = counts[pair[0]] || 0;
            var score2 = counts[pair[1]] || 0;
            return score1 >= score2 ? pair[0] : pair[1];
        }).join('');
    }

    function calculateDetailedScores(answerList) {
        validateAnswers(answerList);
        return answerList.reduce(function (accumulator, current) {
            var val = current.v;
            var weight = current.w || 1;
            accumulator[val] = (accumulator[val] || 0) + weight;
            return accumulator;
        }, {
            'E': 0, 'I': 0, 'S': 0, 'N': 0, 'T': 0, 'F': 0, 'J': 0, 'P': 0
        });
    }

    // 挂到 window 上，方便答题页直接调用而不依赖模块系统。
    global.MBTIScoring = {
        calculatePersonalityType: calculatePersonalityType,
        calculateDetailedScores: calculateDetailedScores,
        validateAnswers: validateAnswers
    };
})(window);