(function () {
    function initMBTIPage() {
        var answers = [];
        var questionContainer = document.getElementById('mbtiquestion');
        var progressBar = document.getElementById('mbti-progress');
        var progressText = document.getElementById('current-progress-text');
        var percentageText = document.getElementById('percentage-text');

        if (!questionContainer) {
            return;
        }

        function updateProgress(currentIndex, total) {
            var percentage = Math.round((currentIndex / total) * 100);
            if (progressBar) progressBar.style.width = percentage + '%';
            if (progressText) progressText.innerText = '第 ' + (currentIndex + 1) + ' 题 / 共 ' + total + ' 题';
            if (percentageText) percentageText.innerText = percentage + '%';
        }

        function createQuestionMarkup(item, index) {
            var display = index === 0 ? 'flex' : 'none';
            var questionNumber = index + 1;
            
            var optionsHtml = (item.options || []).map(function(opt, optIdx) {
                var id = 'q' + questionNumber + 'o' + optIdx;
                return `
                    <label class="mbti-option-item" for="${id}">
                        <input id="${id}" 
                               name="answer-${questionNumber}" 
                               value="${opt.value}" 
                               data-weight="${opt.weight}" 
                               type="radio">
                        <span class="option-check"></span>
                        <span class="option-text">${opt.text}</span>
                    </label>
                `;
            }).join('');

            return `
                <div class="mbti-card animate-fade-in" style="display: ${display};" data-index="${index}">
                    <h2 class="question-title">${questionNumber}. ${item.question}</h2>
                    <div class="mbti-options-group">
                        ${optionsHtml}
                    </div>
                </div>`;
        }

        fetch('./data/questions.json')
            .then(function (response) {
                if (!response.ok) throw new Error('Failed to load questions');
                return response.json();
            })
            .then(function (questionList) {
                questionContainer.innerHTML = ''; // Clear loader
                questionList.forEach(function (item, index) {
                    questionContainer.insertAdjacentHTML('beforeend', createQuestionMarkup(item, index));
                });

                updateProgress(0, questionList.length);

                var isTransitioning = false; // 增加转场锁，防止连点导致进度异常

                questionContainer.addEventListener('change', function (event) {
                    var target = event.target;
                    if (!(target instanceof HTMLInputElement) || target.type !== 'radio' || isTransitioning) return;

                    var currentIndex = parseInt(target.closest('.mbti-card').getAttribute('data-index'));
                    
                    // 标记当前题目已选择样式
                    var optionItems = target.closest('.mbti-options-group').querySelectorAll('.mbti-option-item');
                    optionItems.forEach(el => el.classList.remove('selected'));
                    target.closest('.mbti-option-item').classList.add('selected');

                    // 记录答案及其权重
                    answers[currentIndex] = {
                        v: target.value,
                        w: parseFloat(target.dataset.weight || 1)
                    };
                    
                    isTransitioning = true; // 锁定
                    
                    var currentCard = document.querySelector('.mbti-card[data-index="' + currentIndex + '"]');
                    var nextIndex = currentIndex + 1;
                    var nextCard = document.querySelector('.mbti-card[data-index="' + nextIndex + '"]');

                    if (currentCard) {
                        currentCard.classList.remove('animate-fade-in');
                        currentCard.classList.add('animate-fade-out');
                    }

                    setTimeout(function () {
                        if (currentCard) {
                            currentCard.style.display = 'none';
                            currentCard.classList.remove('animate-fade-out');
                        }
                        
                        isTransitioning = false; // 解锁

                        if (nextCard) {
                            nextCard.style.display = 'flex';
                            nextCard.classList.add('animate-fade-in');
                            // 进度更新基于当前答题的索引
                            updateProgress(nextIndex, questionList.length);
                        } else {
                            // 检查是否所有题目都已完成
                            var answeredCount = answers.filter(function(a) { return a !== undefined; }).length;
                            if (answeredCount === questionList.length) {
                                try {
                                    var resultType = window.MBTIScoring.calculatePersonalityType(answers);
                                    var detailedScores = window.MBTIScoring.calculateDetailedScores(answers);
                                    console.log('Test finished. Result:', resultType, detailedScores);
                                    
                                    localStorage.setItem('mbti_result', resultType);
                                    localStorage.setItem('mbti_detailed_scores', JSON.stringify(detailedScores));
                                    var targetUrl = 'personality-detail.html?type=' + resultType + '&result=' + resultType + '#' + resultType;
                                    window.location.href = targetUrl;
                                } catch (error) {
                                    console.error('Scoring error:', error);
                                    alert('评分失败，请刷新页面后重试。');
                                }
                            } else {
                                // 如果没答完（理论上不会走到这里，除非逻辑有漏）
                                var firstUnanswered = 0;
                                for(var i=0; i<questionList.length; i++) {
                                    if(answers[i] === undefined) {
                                        firstUnanswered = i;
                                        break;
                                    }
                                }
                                var jumpCard = document.querySelector('.mbti-card[data-index="' + firstUnanswered + '"]');
                                if (jumpCard) {
                                    jumpCard.style.display = 'flex';
                                    jumpCard.classList.add('animate-fade-in');
                                    updateProgress(firstUnanswered, questionList.length);
                                }
                            }
                        }
                    }, 400);
                });
            })
            .catch(function () {
                questionContainer.innerHTML = '<p style="text-align:center; padding: 2rem;">题库加载失败，请检查网络后刷新页面。</p>';
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMBTIPage);
    } else {
        initMBTIPage();
    }
})();
