(function ($) {
  'use strict';

  var WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

  var SELECTORS = {
    form: '.js-contact-form',
    submitButton: 'button[type="submit"]',
    messageBox: '.contact-form-message'
  };

  function setMessage($box, type, message) {
    $box
      .removeClass('alert alert-success alert-danger alert-warning d-none')
      .addClass('alert d-block alert-' + type)
      .text(message);
  }

  function clearMessage($box) {
    $box
      .removeClass('alert alert-success alert-danger alert-warning d-block')
      .addClass('d-none')
      .text('');
  }

  function setSubmittingState($button, isSubmitting) {
    $button.prop('disabled', isSubmitting);
    $button.text(isSubmitting ? 'sending...' : 'send mail');
  }

  function extractErrorMessage(jqXHR) {
    if (!jqXHR || !jqXHR.responseJSON) {
      return 'Unable to send your message right now. Please try again.';
    }

    var response = jqXHR.responseJSON;

    if (response.error) {
      return response.error;
    }

    if (Array.isArray(response.errors) && response.errors.length > 0) {
      var firstError = response.errors[0];
      return firstError.message || 'Please check your details and try again.';
    }

    return 'Unable to send your message right now. Please try again.';
  }

  function bindContactForm($form) {
    var $messageBox = $form.find(SELECTORS.messageBox);
    var $submitButton = $form.find(SELECTORS.submitButton);
    var accessKey = ($form.find('[name="access_key"]').val() || '').toString().trim();

    if (!accessKey || accessKey === 'YOUR_ACCESS_KEY_HERE') {
      setMessage(
        $messageBox,
        'warning',
        'Set your real Web3Forms access key in the hidden access_key field before submitting.'
      );
      return;
    }

    clearMessage($messageBox);

    $form.on('submit', function (event) {
      event.preventDefault();

      var formElement = $form.get(0);
      if (formElement && !formElement.checkValidity()) {
        formElement.reportValidity();
        return;
      }

      var formData = new FormData(formElement);
      var payload = Object.fromEntries(formData.entries());

      setSubmittingState($submitButton, true);
      clearMessage($messageBox);

      $.ajax({
        url: WEB3FORMS_ENDPOINT,
        method: 'POST',
        data: JSON.stringify(payload),
        dataType: 'json',
        contentType: 'application/json',
        headers: {
          Accept: 'application/json'
        }
      })
        .done(function (response) {
          var isSuccess = response && response.success;
          var message = response && response.message ? response.message : 'Thanks. Your message was sent successfully.';

          setMessage($messageBox, isSuccess ? 'success' : 'danger', message);

          if (!isSuccess) {
            return;
          }

          formElement.reset();
        })
        .fail(function (jqXHR) {
          setMessage($messageBox, 'danger', extractErrorMessage(jqXHR));
        })
        .always(function () {
          setSubmittingState($submitButton, false);
        });
    });
  }

  $(function () {
    var $form = $(SELECTORS.form).first();
    if ($form.length) {
      bindContactForm($form);
    }
  });
})(jQuery);
