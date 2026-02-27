// Ventara Booking Widget — Embed Script
// Usage:
//   <div id="ventara-booking"></div>
//   <script src="https://lukas5x5.github.io/ventara-widget/embed.js" data-operator="YOUR-UUID"></script>
(function() {
  var script = document.currentScript;
  var operatorId = script.getAttribute('data-operator');
  var container = document.getElementById('ventara-booking') || script.parentElement;

  if (!operatorId) {
    console.error('[Ventara Widget] Missing data-operator attribute');
    return;
  }

  // Wrapper for centering and styling
  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'max-width:500px;margin:0 auto;position:relative;';

  var baseUrl = script.src.replace(/\/embed\.js.*/, '');
  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/?operator=' + encodeURIComponent(operatorId);
  iframe.style.cssText = [
    'width:100%',
    'min-height:680px',
    'border:none',
    'border-radius:24px',
    'overflow:hidden',
    'color-scheme:dark',
    'display:block',
    'opacity:0',
    'transition:opacity 0.4s ease',
    'box-shadow:0 8px 32px rgba(0,0,0,0.3),0 2px 8px rgba(0,0,0,0.2)',
  ].join(';');
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', 'Ventara Booking');
  iframe.setAttribute('allow', 'payment');

  // Fade in once loaded
  iframe.onload = function() {
    iframe.style.opacity = '1';
  };

  // Auto-resize iframe based on content height
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'ventara-resize' && e.data.height) {
      iframe.style.height = Math.max(400, e.data.height) + 'px';
    }
  });

  wrapper.appendChild(iframe);
  container.appendChild(wrapper);
})();
