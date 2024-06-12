document.getElementById("year").innerHTML = getYear();

function getYear() {
  const date = new Date();
  var currentYear = date.getFullYear();

  return currentYear;
}
