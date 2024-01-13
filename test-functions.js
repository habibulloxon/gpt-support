const resetSettings = () => {
  let pastTimestamp = getPastTimeStamp();
  let updatedSettings = {
    fileId: "",
    assistantId: "",
    isAssistantCreated: false,
    threadIds: [],
    emailsLimit: 1000,
    checkTimeStamp: pastTimestamp
  };

  saveSettings(updatedSettings);
}

const sendFileTG = (file) => {
  let url = "https://api.telegram.org/bot6708766677:AAF__OnsbLb9dyU5c6YDr6GSqMu-jyL7Ino/sendDocument"

  let data = {
    'chat_id': '1265546870',
    'document': file
  };

  let options = {
    'method': 'POST',
    'payload': data,
  };

  UrlFetchApp.fetch(url, options);

  console.log("sent")
}

const MD5 = (input, isShortMode) => {
  var isShortMode = !!isShortMode; // Ensure to be bool for undefined type
  var txtHash = '';
  var rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    input,
    Utilities.Charset.UTF_8 // Multibyte encoding env compatibility
  );

  if (!isShortMode) {
    for (i = 0; i < rawHash.length; i++) {

      var hashVal = rawHash[i];

      if (hashVal < 0) {
        hashVal += 256;
      };
      if (hashVal.toString(16).length == 1) {
        txtHash += '0';
      };
      txtHash += hashVal.toString(16);
    };
  } else {
    for (j = 0; j < 16; j += 8) {

      hashVal = (rawHash[j] + rawHash[j + 1] + rawHash[j + 2] + rawHash[j + 3])
        ^ (rawHash[j + 4] + rawHash[j + 5] + rawHash[j + 6] + rawHash[j + 7]);

      if (hashVal < 0) {
        hashVal += 1024;
      };
      if (hashVal.toString(36).length == 1) {
        txtHash += "0";
      };

      txtHash += hashVal.toString(36);
    };
  };

  // change below to "txtHash.toUpperCase()" if needed
  return txtHash;
}

const hashTest = () => {
  const md5Hashed = MD5("Lorem ipsum") // 0956d2fbd5d5c29844a4d21ed2f76e0c - 0956d2fbd5d5c29844a4d21ed2f76e0c
  const md5HashedNew = MD5("Lorem ipsum, dolor amet") // 679d760c1c360ce1429fa01563b0704e
  console.log(md5Hashed)
  console.log(md5HashedNew)
}

const getRepliedMessages = () => {
  let allMessages = "";
  const searchQuery = `after:1705150217`;
  const searchedThreads = GmailApp.search(searchQuery);

  for (let i = 0; i < searchedThreads.length; i++) {
    let thread = searchedThreads[i];
    let threadMessagesNumber = thread.getMessageCount();
    let threadSubject = thread.getFirstMessageSubject()

    let allThreadMessages = ""

    if (threadMessagesNumber === 1) {
      break;
    } else {
      let threadMessages = thread.getMessages();

      for (let i = 0; i < threadMessages.length; i++) {
        let threadMessage = threadMessages[i]
        let messageText = threadMessage.getPlainBody()

        let formattedMessage = messageText.split('wrote:')[0].split('\n').filter(line => line.trim() !== '').join('\n');
        allThreadMessages += `${formattedMessage}\n`
      }

      allMessages += `Subject: ${threadSubject}\nMessages:\n${allThreadMessages}\n\n`;
      allThreadMessages = "";

    }
  }
  console.log(`${allMessages}`)
}