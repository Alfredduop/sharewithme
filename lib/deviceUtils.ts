export const checkDevice = () => {
  const mobile = window.innerWidth < 768 || 'ontouchstart' in window;
  const lowEnd = mobile && (
    navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4 ||
    navigator.deviceMemory && navigator.deviceMemory < 4
  );
  
  return { mobile, lowEnd };
};

export const preventMobileZoom = (isMobile: boolean) => {
  if (isMobile) {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
    }
  }
};