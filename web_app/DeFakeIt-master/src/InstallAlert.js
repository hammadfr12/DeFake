import React, { useState, useEffect } from 'react';

const InstallAlert = () => {
  // State to control alert visibility
  const [showAlert, setShowAlert] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = window.navigator.standalone === true;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e);
    };

    // Only add event listener for non-iOS devices
    if (!/iPhone|iPad/i.test(navigator.userAgent)) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    if (isMobile && !isStandalone && !isInWebAppiOS) {
      setTimeout(() => {
        setShowAlert(true);
      }, 1000);
    }

    return () => {
      if (!/iPhone|iPad/i.test(navigator.userAgent)) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowAlert(false);
    }, 300);
  };

  const handleInstallClick = async () => {
    const isIOS = /iPhone|iPad/i.test(navigator.userAgent);
    
    if (isIOS) {
      // For iOS, just close the modal as users need to follow manual steps
      handleClose();
      return;
    }
    
    // For Android and other browsers with beforeinstallprompt support
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null); // Clear the prompt
    }
    handleClose(); // Close the modal anyway
  };

  // Don't render if alert shouldn't be shown
  if (!showAlert) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />
      
      {/* Alert Box - Fixed centering */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}>
        <div className={`w-full max-w-md transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}>
          <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-purple-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
            
            {/* App Icon */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce" style={{animationDuration: '2s'}}>
                <i className="fas fa-brain text-3xl text-white"></i>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Install DeFakeIt
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Get instant access to AI deepfake detection
              </p>
            </div>
            
            {/* Installation Steps */}
            <div className="space-y-4 mb-6">
              <div className="text-center mb-6">
                {/* <p className="text-white font-semibold mb-4">
                  Install DeFakeIt for the best experience!
                </p> */}
                {/* <p className="text-gray-300 text-sm leading-relaxed"> */}
                <p className="text-white font-semibold mb-4">
                  Add our app to your home screen for quick access and best experience!
                </p>
              </div>
              
              {/* Step-by-step instructions - Different for iOS and Android */}
              <div className="space-y-3">
                {/iPhone|iPad/i.test(navigator.userAgent) ? (
                  // iOS Instructions
                  <>
                    <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Tap the Share button</p>
                        <p className="text-gray-400 text-xs">Look for the square with arrow (📤) at the bottom</p>
                      </div>
                      <div className="text-2xl text-gray-400">
                        <i className="fas fa-share"></i>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Scroll and tap "Add to Home Screen"</p>
                        <p className="text-gray-400 text-xs">Look for the plus icon in the share menu</p>
                      </div>
                      <div className="text-2xl text-gray-400">
                        <i className="fas fa-plus-square"></i>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Tap "Add" to confirm</p>
                        <p className="text-gray-400 text-xs">App will be added to your home screen</p>
                      </div>
                      <div className="text-2xl text-green-400">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    </div>
                  </>
                ) : (
                  // Android/Other Instructions
                  <>
                    <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Tap the menu button</p>
                        <p className="text-gray-400 text-xs">Look for three dots (⋮) or share icon</p>
                      </div>
                      <div className="text-2xl text-gray-400">
                        <i className="fas fa-ellipsis-v"></i>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Select "Add to Home Screen"</p>
                        <p className="text-gray-400 text-xs">Or "Install App" option</p>
                      </div>
                      <div className="text-2xl text-gray-400">
                        <i className="fas fa-plus-square"></i>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Tap "Install" or "Add"</p>
                        <p className="text-gray-400 text-xs">Confirm installation</p>
                      </div>
                      <div className="text-2xl text-green-400">
                        <i className="fas fa-check-circle"></i>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* OR Divider - Better positioned between manual steps and action buttons */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex-1 h-px bg-white/20"></div>
              <p className="text-gray-400 text-xs px-4 bg-slate-900">OR</p>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={handleInstallClick}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 group"
              >
                <i className="fas fa-download group-hover:animate-bounce"></i>
                <span>
                  {/iPhone|iPad/i.test(navigator.userAgent) 
                    ? "Got It!" 
                    : deferredPrompt ? "Install Now!" : "Got It!"
                  }
                </span>
              </button>
              
              <button 
                onClick={handleClose}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                Maybe Later
              </button>
            </div>
            
            {/* Benefits */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-green-400 text-lg mb-1">
                    <i className="fas fa-bolt"></i>
                  </div>
                  <p className="text-xs text-gray-400">Faster Access</p>
                </div>
                <div>
                  <div className="text-purple-400 text-lg mb-1">
                    <i className="fas fa-mobile-alt"></i>
                  </div>
                  <p className="text-xs text-gray-400">Native Feel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallAlert;