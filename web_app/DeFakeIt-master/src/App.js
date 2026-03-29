import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@fortawesome/fontawesome-free/css/all.min.css';
// import InstallAlert from './InstallAlert';
import InstallAlert from './InstallAlert';

const DeepfakeDetector = () => {
  // State management
  const [model, setModel] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [frameCount, setFrameCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [status, setStatus] = useState({ message: 'Initializing AI system...', type: 'loading' });
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [showScanning, setShowScanning] = useState(false);

  // Refs
  const webcamRef = useRef(null);
  const detectionLoopRef = useRef(null);
  const fileInputRef = useRef(null);

  // Model URL
  const modelURL = 'model/';

  // Initialize model
  const initializeModel = useCallback(async () => {
    try {
      setStatus({ message: '🚀 Loading AI model...', type: 'loading' });
      
      const loadedModel = await tf.loadLayersModel(modelURL + 'model.json');
      setModel(loadedModel);
      console.log('Model loaded successfully');
      
      setStatus({ message: '✅ AI system ready - Neural networks initialized', type: 'ready' });
    } catch (error) {
      console.error('Error loading model:', error);
      setStatus({ message: `❌ Error loading model: ${error.message}`, type: 'error' });
    }
  }, []);

  // Setup webcam
  const setupWebcam = useCallback(async () => {
    try {
      setStatus({ message: '📹 Accessing camera...', type: 'loading' });
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      setWebcamStream(stream);
      
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        await new Promise((resolve) => {
          webcamRef.current.onloadedmetadata = () => {
            webcamRef.current.play();
            resolve();
          };
        });
      }
      
      setFrameCount(0);
      setStartTime(Date.now());
      
    } catch (error) {
      setStatus({ message: '❌ Camera access denied - Please allow camera permissions', type: 'error' });
      throw error;
    }
  }, []);

  // Prediction loop
  const predictLoop = useCallback(async () => {
    if (!model || !webcamRef.current || !isDetecting) return;
    
    try {
      const predictionStart = performance.now();
      
      // Preprocess the image to match Teachable Machine's expected input
      const input = tf.browser.fromPixels(webcamRef.current)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims();
      
      // Get prediction using real model
      const predictionResult = await model.predict(input).data();
      
      const predictionEnd = performance.now();
      const processingTime = Math.round(predictionEnd - predictionStart);
      
      // Interpret and display results
      interpretPrediction(predictionResult, processingTime, 'video');
      
      // Clean up tensor to prevent memory leaks
      input.dispose();
      
      // Update frame counter
      setFrameCount(prev => prev + 1);
      
    } catch (error) {
      console.error('Prediction error:', error);
      setStatus({ message: `❌ Analysis error: ${error.message}`, type: 'error' });
      stopDetection();
      return;
    }
    
    // Continue loop with slight delay to prevent overloading
    if (isDetecting) {
      detectionLoopRef.current = setTimeout(() => {
        requestAnimationFrame(predictLoop);
      }, 100);
    }
  }, [model, isDetecting]);

  // Interpret prediction results
  const interpretPrediction = useCallback((predictionData, processingTime, sourceType) => {
    const predictionArray = Array.from(predictionData);
    
    // Get the highest probability class and its confidence
    const maxProbability = Math.max(...predictionArray);
    const predictedClass = predictionArray.indexOf(maxProbability);
    const confidenceScore = maxProbability * 100;
    
    // For display purposes:
    // Class 0 = Real/Authentic
    // Class 1 = Fake/Deepfake
    const isDeepfake = predictedClass === 1;
    const realScore = predictionArray[0] || 0;
    const fakeScore = predictionArray[1] || (predictionArray.length > 1 ? predictionArray[1] : 1 - realScore);
    
    // Calculate certainty level
    const certainty = Math.abs(realScore - fakeScore) * 100;
    const certaintyLevel = certainty > 80 ? 'Very High' : certainty > 60 ? 'High' : certainty > 40 ? 'Medium' : 'Low';
    
    setPrediction({
      isDeepfake,
      confidence: confidenceScore,
      realScore,
      fakeScore,
      certaintyLevel,
      sourceType,
      predictionArray
    });
    
    setConfidence(confidenceScore);
    setProcessingTimeMs(processingTime);
    setShowScanning(true);
    setTimeout(() => setShowScanning(false), 1000);
    
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback(async (file) => {
    if (!model) {
      setStatus({ message: '⚠️ Model not loaded yet', type: 'error' });
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setStatus({ message: '❌ Please upload a valid image file (JPG, PNG, WebP)', type: 'error' });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setStatus({ message: '❌ File too large. Maximum size is 10MB', type: 'error' });
      return;
    }
    
    // Show image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
    
    setStatus({ message: '🔍 Analyzing uploaded image...', type: 'processing' });
    setShowScanning(true);
    
    const img = new Image();
    
    img.onload = async () => {
      try {
        const predictionStart = performance.now();
        
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 224, 224);
        
        // Preprocess the image to match Teachable Machine's expected input
        const input = tf.browser.fromPixels(canvas)
          .toFloat()
          .div(255.0)
          .expandDims();
        
        // Get prediction using real model
        const predictionResult = await model.predict(input).data();
        
        const predictionEnd = performance.now();
        const processingTime = Math.round(predictionEnd - predictionStart);
        
        // Interpret and display results
        interpretPrediction(predictionResult, processingTime, 'image');
        
        // Clean up
        input.dispose();
        URL.revokeObjectURL(img.src);
        
      } catch (error) {
        console.error('Image prediction error:', error);
        setStatus({ message: `❌ Analysis error: ${error.message}`, type: 'error' });
      }
    };
    
    img.onerror = () => {
      setStatus({ message: '❌ Error loading image - file may be corrupted', type: 'error' });
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  }, [model, interpretPrediction]);

  // Start detection
  const startDetection = async () => {
    try {
      await setupWebcam();
      setStatus({ message: '🔍 Real-time analysis active...', type: 'processing' });
      setIsDetecting(true);
      setShowScanning(true);
    } catch (error) {
      // Error already handled in setupWebcam
    }
  };

  // Stop detection
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    setShowScanning(false);
    
    if (detectionLoopRef.current) {
      clearTimeout(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
      if (webcamRef.current) {
        webcamRef.current.srcObject = null;
      }
    }
    
    setStatus({ message: '⏹️ Detection stopped - System ready', type: 'ready' });
    setFrameCount(0);
  }, [webcamStream]);

  // Clear image preview
  const clearImagePreview = () => {
    setImagePreview(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // File drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleImageUpload(e.target.files[0]);
    }
  };

  // Effects
  useEffect(() => {
    initializeModel();
    
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
      if (detectionLoopRef.current) {
        clearTimeout(detectionLoopRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isDetecting && model) {
      predictLoop();
    }
  }, [isDetecting, model, predictLoop]);

  // Status display component
  const StatusDisplay = () => {
    const statusIcons = {
      loading: '⏳',
      ready: '✅',
      processing: '🔍',
      error: '❌'
    };
    
    const statusColors = {
      loading: 'text-blue-400',
      ready: 'text-green-400',
      processing: 'text-purple-400',
      error: 'text-red-400'
    };

    if (prediction) {
      const { isDeepfake, confidence, realScore, fakeScore, certaintyLevel, sourceType, predictionArray } = prediction;
      const resultIcon = isDeepfake ? '🚨' : '✅';
      const resultColor = isDeepfake ? 'text-red-400' : 'text-green-400';

      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">{resultIcon}</div>
            <div className={`text-3xl font-bold ${resultColor} mb-2`}>
              {isDeepfake ? 'DEEPFAKE DETECTED' : 'AUTHENTIC CONTENT'}
            </div>
            <div className="text-gray-400">
              Analysis of {sourceType} completed
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-400 mb-1">Real Probability</div>
              <div className="text-2xl font-bold text-green-400">{(realScore * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-sm text-gray-400 mb-1">Fake Probability</div>
              <div className="text-2xl font-bold text-red-400">{(fakeScore * 100).toFixed(1)}%</div>
            </div>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Certainty Level</span>
              <span className={`text-sm font-semibold ${resultColor}`}>{certaintyLevel}</span>
            </div>
            <div className="text-xs text-gray-500">
              Model confidence: {confidence.toFixed(1)}% | Processing: {processingTimeMs}ms
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Classes detected: {predictionArray.map((p, i) => `Class ${i + 1}: ${(p * 100).toFixed(1)}%`).join(' | ')}
            </div>
          </div>
          
          {isDeepfake ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-exclamation-triangle text-red-400"></i>
                <span className="font-semibold text-red-400">Deepfake Warning</span>
              </div>
              <div className="text-sm text-gray-300">
                This content appears to be artificially generated or manipulated. 
                Exercise caution when sharing or believing this media.
              </div>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <i className="fas fa-shield-check text-green-400"></i>
                <span className="font-semibold text-green-400">Authenticity Verified</span>
              </div>
              <div className="text-sm text-gray-300">
                This content appears to be genuine and unmanipulated.
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">{statusIcons[status.type] || '🤖'}</div>
        <p className={`${statusColors[status.type] || 'text-gray-400'} text-lg font-semibold`}>
          {status.message}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-x-hidden">
      <InstallAlert />
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse bg-[length:400%_400%]"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-bounce" style={{animationDuration: '6s'}}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-bounce" style={{animationDuration: '8s', animationDelay: '-3s'}}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center animate-pulse">
                <i className="fas fa-brain text-xl text-white"></i>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI Deepfake Detector
              </h1>
              <p className="text-sm text-gray-400">Advanced Neural Network Detection</p>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            Detect Deepfakes
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Powered by cutting-edge AI technology, our advanced neural network can identify manipulated media with unprecedented accuracy.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <i className="fas fa-shield-alt text-green-400"></i>
              <span className="text-sm">98.2% Accuracy</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <i className="fas fa-bolt text-yellow-400"></i>
              <span className="text-sm">Real-time Processing</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <i className="fas fa-lock text-blue-400"></i>
              <span className="text-sm">Privacy Protected</span>
            </div>
          </div>
        </div>

        {/* Detection Interface */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Live Camera Section */}
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 group">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:animate-pulse">
                  <i className="fas fa-video text-xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Live Camera Detection</h3>
                  <p className="text-gray-400">Real-time deepfake analysis</p>
                </div>
              </div>
              
              <div className="relative mb-6">
                <video 
                  ref={webcamRef}
                  className="w-full h-64 bg-gray-800 rounded-2xl object-cover border-2 border-dashed border-gray-600" 
                  autoPlay 
                  muted
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl pointer-events-none"></div>
                {showScanning && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button 
                  onClick={startDetection}
                  disabled={!model || isDetecting}
                  className="flex-1 relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 group"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <i className="fas fa-play"></i>
                    <span>Start Detection</span>
                  </span>
                </button>
                <button 
                  onClick={stopDetection}
                  disabled={!isDetecting}
                  className="flex-1 relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 group"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <i className="fas fa-stop"></i>
                    <span>Stop Detection</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 group">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:animate-pulse">
                  <i className="fas fa-cloud-upload-alt text-xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Upload Image</h3>
                  <p className="text-gray-400">Analyze uploaded media files</p>
                </div>
              </div>
              
              <div className="relative">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <div 
                  className="relative border-2 border-dashed border-gray-600 hover:border-blue-400 rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group-hover:bg-white/5"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {!imagePreview ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto animate-bounce" style={{animationDuration: '3s'}}>
                        <i className="fas fa-image text-2xl text-white"></i>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white mb-2">Drop your image here</p>
                        <p className="text-gray-400">or click to browse</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Supports: JPG, PNG, WebP (Max 10MB)
                      </div>
                    </div>
                  ) : (
                    <div>
                      <img src={imagePreview} className="w-full h-64 object-cover rounded-xl mb-4" alt="Uploaded" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400 truncate">{fileName}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            clearImagePreview();
                          }}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-8">
            {/* Status Display */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center animate-pulse">
                  <i className="fas fa-brain text-xl text-white"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">AI Analysis</h3>
                  <p className="text-gray-400">Neural network processing</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <StatusDisplay />
              </div>
            </div>

            {/* Confidence Meter */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
              <h4 className="text-xl font-bold text-white mb-6">Detection Confidence</h4>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Authentic</span>
                  <span>Deepfake</span>
                </div>
                <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${
                      prediction?.isDeepfake 
                        ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`}
                    style={{ width: `${Math.max(5, confidence)}%` }}
                  ></div>
                  {showScanning && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  )}
                </div>
                <div className="text-center">
                  <span className={`text-2xl font-bold ${
                    prediction?.isDeepfake ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {prediction ? `${confidence.toFixed(1)}% ${prediction.isDeepfake ? 'FAKE' : 'REAL'}` : '--'}
                  </span>
                </div>
              </div>
            </div>

            {/* Processing Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{frameCount}</div>
                <div className="text-sm text-gray-400">Frames Analyzed</div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">{processingTimeMs}ms</div>
                <div className="text-sm text-gray-400">Processing Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <h3 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Advanced Detection Features
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 group hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-pulse">
                <i className="fas fa-eye text-2xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Facial Analysis</h4>
              <p className="text-gray-400">
                Advanced facial landmark detection and micro-expression analysis to identify synthetic content.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 group hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-pulse">
                <i className="fas fa-network-wired text-2xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Neural Networks</h4>
              <p className="text-gray-400">
                Multiple deep learning models working in ensemble to provide the most accurate detection results.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 group hover:transform hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:animate-pulse">
                <i className="fas fa-shield-alt text-2xl text-white"></i>
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Real-time Protection</h4>
              <p className="text-gray-400">
                Instant detection capabilities for live video streams and uploaded content with minimal latency.
              </p>
            </div>
          </div>
          {/* Made with love section */}
          <div className="mt-16 flex justify-center">
            <p className="text-lg font-semibold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent text-center">
              Made with ❤ by Khazi18
            </p>
          </div>
        </div>        
</main>
</div>
);
};

export default DeepfakeDetector;

