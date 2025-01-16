        function waitForOpenCV(callback) {
            if (typeof cv !== 'undefined') {
                callback();
            } else {
                setTimeout(() => waitForOpenCV(callback), 100);
            }
        }

        document.getElementById('compare-btn').addEventListener('click', () => {
            const image1 = document.getElementById('image1').files[0];
            const image2 = document.getElementById('image2').files[0];
            const resultDiv = document.getElementById('result');

            if (!image1 || !image2) {
                alert("Por favor, carregue as duas imagens.");
                return;
            }

            waitForOpenCV(() => {
                const canvas1 = document.getElementById('canvas1');
                const canvas2 = document.getElementById('canvas2');
                const ctx1 = canvas1.getContext('2d');
                const ctx2 = canvas2.getContext('2d');
                const img1 = new Image();
                const img2 = new Image();

                img1.onload = () => {
                    canvas1.width = img1.width;
                    canvas1.height = img1.height;
                    ctx1.drawImage(img1, 0, 0);
                    const mat1 = cv.imread(canvas1);

                    img2.onload = () => {
                        canvas2.width = img2.width;
                        canvas2.height = img2.height;
                        ctx2.drawImage(img2, 0, 0);
                        const mat2 = cv.imread(canvas2);

                        try {
                            // Converter para escala de cinza
                            const gray1 = new cv.Mat();
                            const gray2 = new cv.Mat();
                            cv.cvtColor(mat1, gray1, cv.COLOR_RGBA2GRAY);
                            cv.cvtColor(mat2, gray2, cv.COLOR_RGBA2GRAY);

                            // Configurar ORB com mais pontos-chave
                            const orb = new cv.ORB(1000);
                            const keypoints1 = new cv.KeyPointVector();
                            const keypoints2 = new cv.KeyPointVector();
                            const descriptors1 = new cv.Mat();
                            const descriptors2 = new cv.Mat();

                            // Detectar e computar pontos-chave
                            orb.detectAndCompute(gray1, new cv.Mat(), keypoints1, descriptors1);
                            orb.detectAndCompute(gray2, new cv.Mat(), keypoints2, descriptors2);

                            // Matcher com cross-checking
                            const bf = new cv.BFMatcher(cv.NORM_HAMMING, true);
                            const matches = new cv.DMatchVector();
                            
                            if (descriptors1.rows > 0 && descriptors2.rows > 0) {
                                bf.match(descriptors1, descriptors2, matches);
                            }

                            // Calcular diferença baseada nos matches
                            const similarityScore = (matches.size() / Math.min(keypoints1.size(), keypoints2.size())) * 100;
                            resultDiv.textContent = `Similaridade: ${similarityScore.toFixed(2)}%`;
                            
                            // Marcar diferenças
                            const colorRed = new cv.Scalar(255, 0, 0, 255);
                            const colorGreen = new cv.Scalar(0, 255, 0, 255);
                            
                            // Desenhar todos os keypoints em vermelho primeiro
                            for (let i = 0; i < keypoints1.size(); i++) {
                                const pt = keypoints1.get(i).pt;
                                cv.circle(mat1, new cv.Point(pt.x, pt.y), 3, colorRed, -1);
                            }
                            for (let i = 0; i < keypoints2.size(); i++) {
                                const pt = keypoints2.get(i).pt;
                                cv.circle(mat2, new cv.Point(pt.x, pt.y), 3, colorRed, -1);
                            }

                            // Sobrepor matches em verde
                            for (let i = 0; i < matches.size(); i++) {
                                const match = matches.get(i);
                                const kp1 = keypoints1.get(match.queryIdx).pt;
                                const kp2 = keypoints2.get(match.trainIdx).pt;
                                cv.circle(mat1, new cv.Point(kp1.x, kp1.y), 5, colorGreen, 2);
                                cv.circle(mat2, new cv.Point(kp2.x, kp2.y), 5, colorGreen, 2);
                            }

                            cv.imshow(canvas1, mat1);
                            cv.imshow(canvas2, mat2);

                            // Limpar memória
                            [mat1, mat2, gray1, gray2, descriptors1, descriptors2, keypoints1, keypoints2, matches, orb, bf].forEach(item => {
                                if (item && typeof item.delete === 'function') item.delete();
                            });

                        } catch (error) {
                            console.error('Erro ao processar imagens:', error);
                            resultDiv.textContent = 'Erro ao processar as imagens';
                        }
                    };

                    const reader2 = new FileReader();
                    reader2.onload = (e) => img2.src = e.target.result;
                    reader2.readAsDataURL(image2);
                };

                const reader1 = new FileReader();
                reader1.onload = (e) => img1.src = e.target.result;
                reader1.readAsDataURL(image1);
            });
        });
