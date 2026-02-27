// Ventara Booking Widget — Embed Script
// Usage:
//   <div id="ventara-booking"></div>
//   <script src="https://widget.ventara.com/embed.js" data-operator="YOUR-UUID"></script>
(function() {
  var script = document.currentScript;
  var operatorId = script.getAttribute('data-operator');
  var lang = script.getAttribute('data-lang') || 'de';
  var accent = script.getAttribute('data-accent') || '#06b6d4';
  var container = document.getElementById('ventara-booking') || script.parentElement;

  if (!operatorId) {
    console.error('[Ventara Widget] Missing data-operator attribute');
    return;
  }

  var baseUrl = script.src.replace(/\/embed\.js.*/, '');
  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/?operator=' + encodeURIComponent(operatorId);
  iframe.style.width = '100%';
  iframe.style.minHeight = '700px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '20px';
  iframe.style.overflow = 'hidden';
  iframe.style.colorScheme = 'dark';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('title', 'Ventara Booking');
  iframe.setAttribute('allow', 'payment');

  // Auto-resize iframe based on content height
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'ventara-resize' && e.data.height) {
      iframe.style.height = e.data.height + 'px';
    }
  });

  container.appendChild(iframe);
})();
