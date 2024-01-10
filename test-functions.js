function test() {
  let thread = GmailApp.getInboxThreads(0, 1)[0];
  let message = thread.getMessages()[0];
  let msgDate = message.getDate()

  let dateObject = new Date(msgDate);
  let timestamp = dateObject.getTime();

  console.log(timestamp)
}

// function sendFile() {
//   let file = getAllMessagesFile()
//   let url = "https://api.telegram.org/bot6708766677:AAF__OnsbLb9dyU5c6YDr6GSqMu-jyL7Ino/sendDocument"

//   let data = {
//     'chat_id': '1265546870',
//     'document': file
//   };

//   let options = {
//     'method': 'POST',
//     'payload': data,
//   };

//   UrlFetchApp.fetch(url, options);

//   console.log("sent")
// }

function getIds() {
  let threads = GmailApp.getInboxThreads();
  let ids = [];

  for (let i = 0; i < threads.length; i++) {
    let id = threads[i].getId()
    ids.push(id)
  }

  Logger.log(ids)
}

const sendEmail = () => {
  let thread = GmailApp.getThreadById("18cd939eaa91e360")
  let messagesArray = thread.getMessages()

  let lastMessage = messagesArray[messagesArray.length - 1]
  lastMessage.reply("Lets go")
  console.log("replied")
}

// function deleteSettings() {
//   let updatedSettings = {
//     fileId: "",
//     assistantId: "",
//     isAssistantCreated: false
//   };

//   saveSettings(updatedSettings);
// }

// const getCurrentTimeStamp = () => {
//   let currentTimestamp = Math.floor(Date.now() / 1000);

//   return currentTimestamp
// }

// const getTimestampThreeDaysAgo = () => {
//   const threeDaysAgo = new Date();
//   threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

//   const timestampThreeDaysAgo = Math.floor(threeDaysAgo.getTime() / 1000);

//   return timestampThreeDaysAgo;
// }

const getEmailsAfterTimestamp = () => {
  let searchQuery = `is:unread after:${1704870668}`;
  console.log(searchQuery)
  let searchedThreads = GmailApp.search(searchQuery);


  searchedThreads.forEach((thread) => {
    let messages = thread.getMessages();

    messages.forEach((message) => {
      let subject = message.getSubject();
      let sender = message.getFrom();
      let body = message.getPlainBody();

      Logger.log('Subject: ' + subject);
      Logger.log('Sender: ' + sender);
      Logger.log('Body: ' + body);
      Logger.log('--------------');
    });
  });
};