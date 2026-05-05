(function () {
    function getQueryType() {
        // 1. 尝试标准 search 参数 (?type=INTJ)
        var params = new URLSearchParams(window.location.search);
        var type = params.get('type') || params.get('result');
        
        // 2. 尝试从 Hash 中解析 (#INTJ, #/INTJ, #?type=INTJ)
        if (!type && window.location.hash) {
            var hash = window.location.hash.substring(1);
            if (hash.includes('?')) {
                var hashParams = new URLSearchParams(hash.split('?')[1]);
                type = hashParams.get('type') || hashParams.get('result');
            } else {
                // 直接处理 #INTJ 或 #/INTJ
                type = hash.replace(/^\//, '');
            }
        }

        // 3. 最终回退：尝试从 localStorage 读取最近一次的结果
        if (!type || type.length !== 4) {
            type = localStorage.getItem('mbti_result');
        }

        // 验证是否为合法的 4 位代码 (如 INTJ)
        if (type && /^[EIST][NS][TF][JP]$/i.test(type.trim())) {
            return type.trim().toUpperCase();
        }

        return '';
    }

    function findPersonality(personalities, type) {
        // 数据文件是数组结构，这里按 type 字段顺序查找对应人格。
        for (var index = 0; index < personalities.length; index += 1) {
            if (personalities[index].type === type) {
                return personalities[index];
            }
        }

        return null;
    }

    function updateMeta(selector, content) {
        // 同步更新标题和描述，便于 SEO 与社交分享展示正确的人格信息。
        var element = document.querySelector(selector);

        if (element) {
            element.setAttribute('content', content);
        }
    }

    function renderError(message, subtitleElement, contentElement) {
        // 错误状态下仍保留页面结构，只替换副标题和正文内容。
        subtitleElement.textContent = message;
        contentElement.innerHTML = '<p>' + message + '</p>';
    }

    $(function () {
        // 这些 DOM 节点是详情页渲染的核心出口，任何一个缺失都直接中止执行。
        var typeElement = document.getElementById('personality-type');
        var subtitleElement = document.getElementById('personality-subtitle');
        var contentElement = document.getElementById('personality-content');
        var personalityType = getQueryType();

        if (!typeElement || !subtitleElement || !contentElement) {
            return;
        }

        if (!personalityType) {
            console.log('Personality type missing from URL and storage.');
            renderError('缺少人格类型参数。', subtitleElement, contentElement);
            
            // 引导用户查看所有人格列表，而不是显示一个空白错误页
            contentElement.innerHTML += `
                <div style="margin-top: 2rem; text-align: center;">
                    <p>您可以从下方列表中选择一个感兴趣的人格进行查看：</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 1rem;">
                        ${['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'].map(t => `<a href="?type=${t}" class="mbti-btn mbti-btn-outline" style="padding: 0.5rem 1rem; min-width: auto;">${t}</a>`).join('')}
                    </div>
                </div>
            `;
            return;
        }

        console.log('Rendering personality:', personalityType);

        // 统一从 JSON 读取人格正文，保证列表页和详情页使用同一份数据源。
        $.getJSON('./data/personality-content.json', function (personalities) {
            var personality = findPersonality(personalities, personalityType);

            if (!personality) {
                renderError('未找到对应的人格类型。', subtitleElement, contentElement);
                return;
            }

            typeElement.textContent = personality.type;
            subtitleElement.textContent = personality.subtitle || '人格详情';
            contentElement.innerHTML = personality.contentHtml || '<p>暂无人格详情内容。</p>';

            // --- 新增：页面内直接显示的真实权重进度条渲染逻辑 ---
            var pageTraitsContainer = document.getElementById('page-traits');
            if (pageTraitsContainer) {
                var detailedScores = null;
                try {
                    detailedScores = JSON.parse(localStorage.getItem('mbti_detailed_scores'));
                } catch(e) {}

                if (detailedScores) {
                    var type = personality.type.toUpperCase();
                    var traitsHtml = '';
                    var dimensions = [
                        { left: 'E', right: 'I', labelL: '外向', labelR: '内向', cls: 'bar-ei' },
                        { left: 'S', right: 'N', labelL: '实感', labelR: '直觉', cls: 'bar-sn' },
                        { left: 'T', right: 'F', labelL: '思考', labelR: '情感', cls: 'bar-tf' },
                        { left: 'J', right: 'P', labelL: '判断', labelR: '知觉', cls: 'bar-jp' }
                    ];

                    dimensions.forEach(function(dim, idx) {
                        var leftVal = detailedScores[dim.left] || 0;
                        var rightVal = detailedScores[dim.right] || 0;
                        var total = leftVal + rightVal;
                        var isRight = (type[idx] === dim.right);
                        var percentage = total > 0 ? (isRight ? (rightVal / total * 100) : (leftVal / total * 100)) : 50;
                        var displayPercent = Math.round(percentage);
                        var fillStyle = isRight ? 'right: 0; width: ' + percentage + '%;' : 'left: 0; width: ' + percentage + '%;';

                        traitsHtml += `
                            <div class="page-trait-row ${dim.cls}">
                                <div class="dim-label-group left ${!isRight ? 'active' : ''}">
                                    <span class="dim-letter">${dim.left}</span>
                                    <span class="dim-name">${dim.labelL}</span>
                                </div>
                                <div class="page-trait-bar-bg">
                                    <div class="page-trait-bar-fill" style="${fillStyle}"></div>
                                    <span class="page-trait-percent" style="${isRight ? 'right: 8px;' : 'left: 8px;'}">${displayPercent}%</span>
                                </div>
                                <div class="dim-label-group right ${isRight ? 'active' : ''}">
                                    <span class="dim-name">${dim.labelR}</span>
                                    <span class="dim-letter">${dim.right}</span>
                                </div>
                            </div>`;
                    });
                    pageTraitsContainer.innerHTML = traitsHtml;
                    pageTraitsContainer.style.display = 'block';
                }
            }

            // --- 动态生成目录导航 ---
            var headers = contentElement.querySelectorAll('h3');
            if (headers.length > 0) {
                var tocHtml = '<div class="mbti-toc-container"><ul class="mbti-toc">';
                headers.forEach(function (header, index) {
                    var headerId = 'section-' + index;
                    header.id = headerId;
                    tocHtml += '<li class="mbti-toc-item"><a href="#' + headerId + '">' + header.textContent + '</a></li>';
                });
                tocHtml += '</ul></div>';
                
                // 将目录插入到卡片容器之前，确保其吸顶时不被卡片边界限制
                var cardContainer = contentElement.closest('.content-card');
                if (cardContainer) {
                    cardContainer.insertAdjacentHTML('beforebegin', tocHtml);
                } else {
                    contentElement.insertAdjacentHTML('afterbegin', tocHtml);
                }

                // 获取新插入的 TOC 容器中的链接
                var tocContainer = document.querySelector('.mbti-toc-container');
                tocContainer.querySelectorAll('a').forEach(function(anchor) {
                    anchor.addEventListener('click', function(e) {
                        e.preventDefault();
                        var targetId = this.getAttribute('href');
                        var targetElement = document.querySelector(targetId);
                        if (targetElement) {
                            var offset = 100; // 考虑吸顶导航的高度
                            var elementPosition = targetElement.getBoundingClientRect().top;
                            var offsetPosition = elementPosition + window.pageYOffset - offset;

                            window.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                            });
                        }
                    });
                });

                // 监听滚动，高亮当前章节并自动滚动目录项到可视区域
                window.addEventListener('scroll', function() {
                    var scrollPosition = window.pageYOffset + 150; // 偏移量，确保接近顶部时触发
                    var currentId = '';

                    headers.forEach(function(header) {
                        if (scrollPosition >= header.offsetTop) {
                            currentId = header.id;
                        }
                    });

                    if (currentId) {
                        var activeLink = tocContainer.querySelector('a[href="#' + currentId + '"]');
                        if (activeLink && !activeLink.classList.contains('active')) {
                            // 清除旧的 active
                            tocContainer.querySelectorAll('a').forEach(function(link) {
                                link.classList.remove('active');
                            });
                            // 设置新的 active
                            activeLink.classList.add('active');
                            
                            // 关键逻辑：自动滚动目录栏，使当前 active 项居中显示
                            var tocList = tocContainer.querySelector('.mbti-toc');
                            if (tocList) {
                                // 使用父级 li 的 offset，因为它才是相对于 ul 定位的
                                var activeLi = activeLink.parentElement;
                                var linkOffset = activeLi.offsetLeft;
                                var linkWidth = activeLi.offsetWidth;
                                var containerWidth = tocList.offsetWidth;
                                
                                tocList.scrollTo({
                                    left: linkOffset - (containerWidth / 2) + (linkWidth / 2),
                                    behavior: 'smooth'
                                });
                            }
                        }
                    }
                });
            }

            // 页面标题与 meta 描述跟随人格切换
            document.title = personality.type + ' | MBTI 人格详情';
            updateMeta('meta[property="og:title"]', personality.type + ' | MBTI 人格详情');
            updateMeta('meta[property="og:description"]', personality.description || personality.subtitle || '查看 MBTI 各人格类型的详细解析。');
            updateMeta('meta[name="description"]', personality.description || personality.subtitle || '查看 MBTI 各人格类型的详细解析。');

            // --- 分享海报逻辑 ---
            var shareBtn = document.getElementById('share-btn');
            var shareModal = document.getElementById('share-modal');
            var modalClose = document.getElementById('modal-close');
            var posterTemplate = document.getElementById('poster-template');
            var posterResult = document.getElementById('poster-result');

            if (shareBtn && shareModal && posterTemplate) {
                shareBtn.addEventListener('click', function() {
                    // 1. 获取详细得分（从 localStorage 读取答题时的真实权重分）
                    var detailedScores = null;
                    try {
                        detailedScores = JSON.parse(localStorage.getItem('mbti_detailed_scores'));
                    } catch(e) {
                        console.warn('Failed to parse detailed scores');
                    }

                    // 2. 编写动态建议生成函数
                    function generateExpertAdvice(type, scores, calcType) {
                        if (!scores) return (personality.description || '').substring(0, 65) + '...';
                        
                        var pairs = [
                            { l: 'E', r: 'I', name: '能量来源' },
                            { l: 'S', r: 'N', name: '认知方式' },
                            { l: 'T', r: 'F', name: '决策偏好' },
                            { l: 'J', r: 'P', name: '生活特征' }
                        ];

                        // 找到最突出的维度
                        var intensities = pairs.map(p => {
                            var total = scores[p.l] + scores[p.r];
                            var pL = (scores[p.l] / (total || 1)) * 100;
                            var pR = (scores[p.r] / (total || 1)) * 100;
                            return { 
                                dim: pL >= pR ? p.l : p.r, 
                                val: Math.max(pL, pR),
                                name: p.name
                            };
                        });
                        
                        intensities.sort((a, b) => b.val - a.val);
                        var top = intensities[0];
                        var second = intensities[1];

                        // 动态获取副标题（从数据源中找）
                        var realPersonality = personalities.find(p => p.type === calcType) || personality;
                        document.getElementById('poster-type').textContent = calcType;
                        document.getElementById('poster-subtitle').textContent = realPersonality.subtitle || '性格解析';

                        var advice = "";
                        if (top.val > 80) {
                            advice = `作为 ${calcType}，你在${top.name}上表现出极强的倾向性(${Math.round(top.val)}%)。这赋予了你极高的${top.dim === 'T' ? '逻辑严密性' : '行动力'}，但也请注意避免决策时的盲点。`;
                        } else if (top.val < 60) {
                            advice = `你的性格表现非常平衡。虽然倾向于 ${calcType}，但在${top.name}维度上展现了很好的弹性和跨维度整合能力。`;
                        } else {
                            advice = `你是一个稳健的 ${calcType}。你在${top.name}上的偏好非常明确，配合${second.name}的辅助，这使你在处理事务时既能保持原则又不失灵活性。`;
                        }
                        
                        return advice;
                    }

                    // 预先计算出人格代码，供后续所有逻辑使用
                    var calcType = personality.type; // 默认
                    if (detailedScores) {
                        var pairs = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
                        calcType = pairs.map(p => {
                            return (detailedScores[p[0]] >= detailedScores[p[1]]) ? p[0] : p[1];
                        }).join('');
                    }

                    // 更新海报描述为专家建议
                    document.getElementById('poster-desc').textContent = generateExpertAdvice(personality.type, detailedScores, calcType);
                    
                    // 解析人格特征维度并生成对比条
                    var type = calcType.toUpperCase();
                    var traitsHtml = '';
                    var dimensions = [
                        { left: 'E', right: 'I', labelL: '外向', labelR: '内向', cls: 'bar-ei' },
                        { left: 'S', right: 'N', labelL: '实感', labelR: '直觉', cls: 'bar-sn' },
                        { left: 'T', right: 'F', labelL: '思考', labelR: '情感', cls: 'bar-tf' },
                        { left: 'J', right: 'P', labelL: '判断', labelR: '知觉', cls: 'bar-jp' }
                    ];

                    dimensions.forEach(function(dim, idx) {
                        var char = calcType[idx];
                        var isRight = (char === dim.right);
                        
                        // 计算真实百分比
                        var percentage = 75; // 默认值
                        if (detailedScores) {
                            var leftVal = detailedScores[dim.left] || 0;
                            var rightVal = detailedScores[dim.right] || 0;
                            var total = leftVal + rightVal;
                            if (total > 0) {
                                percentage = isRight ? (rightVal / total * 100) : (leftVal / total * 100);
                            }
                        }
                        
                        var displayPercent = Math.round(percentage);
                        percentage = Math.max(10, Math.min(100, percentage));
                        
                        var fillStyle = isRight ? 'right: 0; width: ' + percentage + '%;' : 'left: 0; width: ' + percentage + '%;';
                        
                        traitsHtml += '<div class="trait-bar-group ' + dim.cls + '">' +
                            '<div class="trait-label-group left ' + (!isRight ? 'active' : '') + '">' +
                                '<span class="trait-letter">' + dim.left + '</span>' +
                                '<span class="trait-name">' + dim.labelL + '</span>' +
                            '</div>' +
                            '<div class="trait-bar-bg">' +
                                '<div class="trait-bar-fill" style="' + fillStyle + '"></div>' +
                                '<span class="trait-percent" style="' + (isRight ? 'right: 8px;' : 'left: 8px;') + '">' + displayPercent + '%</span>' +
                            '</div>' +
                            '<div class="trait-label-group right ' + (isRight ? 'active' : '') + '">' +
                                '<span class="trait-name">' + dim.labelR + '</span>' +
                                '<span class="trait-letter">' + dim.right + '</span>' +
                            '</div>' +
                        '</div>';
                    });
                    document.getElementById('poster-traits').innerHTML = traitsHtml;

                    // 生成动态二维码 (链接到测试首页)
                    var baseUrl = window.location.href.split('?')[0].split('#')[0];
                    var homeUrl = baseUrl.replace('personality-detail.html', 'index.html');
                    document.getElementById('poster-qrcode').src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(homeUrl);

                    // 2. 显示模态框并开始生成
                    shareModal.classList.add('active');
                    posterResult.innerHTML = '<p style="padding: 2rem;">海报生成中...</p>';

                    // 确保图片加载完成后再生成
                    setTimeout(function() {
                        html2canvas(posterTemplate, {
                            useCORS: true,
                            scale: 2, // 提高清晰度
                            backgroundColor: '#ffffff'
                        }).then(function(canvas) {
                            var imgData = canvas.toDataURL('image/png');
                            posterResult.innerHTML = '<img src="' + imgData + '" class="generated-image" alt="MBTI 海报">';
                        }).catch(function(err) {
                            console.error('Poster generation failed:', err);
                            posterResult.innerHTML = '<p style="color: red; padding: 2rem;">海报生成失败，请稍后重试。</p>';
                        });
                    }, 500);
                });

                modalClose.addEventListener('click', function() {
                    shareModal.classList.remove('active');
                });

                shareModal.addEventListener('click', function(e) {
                    if (e.target === shareModal) {
                        shareModal.classList.remove('active');
                    }
                });
            }
        }).fail(function () {
            renderError('人格数据加载失败，请稍后重试。', subtitleElement, contentElement);
        });
    });
})();
