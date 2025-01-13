var stepper1;
var stepper2;
var stepper4;
var stepperForm;

document.addEventListener('DOMContentLoaded', function () {
  // Initialize Stepper instances
  stepper1 = new Stepper(document.querySelector('#stepper1'));
  stepper2 = new Stepper(document.querySelector('#stepper2'), {
    linear: false
  });

  // stepper3 is removed as per the updated structure
  // stepper3 = new Stepper(document.querySelector('#stepper3'));

  // Initialize stepperForm instance
  var stepperFormEl = document.querySelector('#stepperForm');
  stepperForm = new Stepper(stepperFormEl, {
    animation: true
  });

  // Get button and pane elements
  var btnNextList = [].slice.call(document.querySelectorAll('.btn-next-form'));
  var stepperPanList = [].slice.call(stepperFormEl.querySelectorAll('.bs-stepper-pane'));
  var inputMailForm = document.getElementById('inputMailForm');
  var inputPasswordForm = document.getElementById('inputPasswordForm');
  var form = stepperFormEl.querySelector('.bs-stepper-content form');

  // Add event listeners for next buttons
  btnNextList.forEach(function (btn) {
    btn.addEventListener('click', function () {
      stepperForm.next();
    });
  });

  // Stepper form validation on show event
  stepperFormEl.addEventListener('show.bs-stepper', function (event) {
    form.classList.remove('was-validated');
    var nextStep = event.detail.indexStep;
    var currentStep = nextStep;

    if (currentStep > 0) {
      currentStep--;
    }

    var stepperPan = stepperPanList[currentStep];

    // Validation checks for specific forms
    if ((stepperPan.getAttribute('id') === 'test-form-1' && !inputMailForm.value.length) ||
      (stepperPan.getAttribute('id') === 'test-form-2' && !inputPasswordForm.value.length)) {
      event.preventDefault();
      form.classList.add('was-validated');
    }
  });
});
