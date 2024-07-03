document.getElementById("year").innerHTML = getYear();

function getYear() {
  const date = new Date();
  var currentYear = date.getFullYear();

  return currentYear;
}

const form = document.getElementById("form");

form.addEventListener("submit", submitForm);

function submitForm(e) {
  // e.preventDefault();
}

//similar to the above to check , two passwords before submitting but not prevent default
