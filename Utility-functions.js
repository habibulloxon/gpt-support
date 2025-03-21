const convertDateToTimeStamp = (date) => {
  var dateObject = new Date(date).getTime();
  let unixTimestamp = dateObject / 1000;
  console.log("unixTimestamp: ", unixTimestamp);

  return unixTimestamp;
};

const getTimeStampDifference = (firstTimeStamp, secondTimeStamp) => {
  let first = parseInt(firstTimeStamp);
  let second = parseInt(secondTimeStamp);
  let difference = second - first;
  return difference;
};

const formatMessageSender = (str) => {
  const parts = str.split("<");
  const contentBeforeAngleBracket = parts[0].trim();
  return contentBeforeAngleBracket.replace(/"/g, "");
};

const formatAssistantResponse = (inputString) => {
  let outputString = inputString.replace(/【.*?】/g, "");
  return outputString;
};

const getMonthName = (monthNumber) => {
  let monthName;

  switch (monthNumber) {
    case 0:
      monthName = "January";
      break;
    case 1:
      monthName = "February";
      break;
    case 2:
      monthName = "March";
      break;
    case 3:
      monthName = "April";
      break;
    case 4:
      monthName = "May";
      break;
    case 5:
      monthName = "June";
      break;
    case 6:
      monthName = "July";
      break;
    case 7:
      monthName = "August";
      break;
    case 8:
      monthName = "September";
      break;
    case 9:
      monthName = "October";
      break;
    case 10:
      monthName = "November";
      break;
    case 11:
      monthName = "December";
      break;
    default:
      monthName = "Invalid month number";
  }

  return monthName;
};

const timestampToDayTime = (timestamp) => {
  const dateObj = new Date(timestamp * 1000);
  const date = dateObj.getDate();
  const month = getMonthName(dateObj.getMonth()); // Assuming getMonthName is an efficient way to get the month name
  const hour = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  const formattedDateTime = `${month} ${date}, ${hour}:${minutes}`;
  // console.log(formattedDateTime);

  return formattedDateTime;
};


const sendFileTG = (file) => {
  let url =
    "https://api.telegram.org/bot6708766677:AAF__OnsbLb9dyU5c6YDr6GSqMu-jyL7Ino/sendDocument";

  let data = {
    chat_id: "1265546870",
    document: file,
  };

  let options = {
    method: "POST",
    payload: data,
  };

  UrlFetchApp.fetch(url, options);

  console.log("sent");
};

const sendMessageTG = () => {
  let url =
    "https://api.telegram.org/bot6708766677:AAF__OnsbLb9dyU5c6YDr6GSqMu-jyL7Ino/sendMessage";

  let data = {
    chat_id: "1265546870",
    text: USERNAME,
  };

  let options = {
    method: "POST",
    contentType: 'application/json', // Important for JSON payload
    payload: JSON.stringify(data), // Ensure payload is stringified
  };

  UrlFetchApp.fetch(url, options);

  console.log("Message sent");
};
