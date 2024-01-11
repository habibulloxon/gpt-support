
const clearSettings = () => {
  let updatedSettings = {
    fileId: "",
    assistantId: "",
    isAssistantCreated: false
  };

  saveSettings(updatedSettings);
}

const temporarySettings = () => {
  let threeDaysAgoTimestamp = getTimestampThreeDaysAgo();
  let updatedSettings = {
    fileId: "",
    assistantId: "",
    isAssistantCreated: false,
    threadIds: [],
    checkTimeStamp: threeDaysAgoTimestamp
  };

  saveSettings(updatedSettings);
}


const testGetUnreadMessages = () => {
  let timeStart
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let currentTimestamp = getCurrentTimeStamp()

  const previousCheckDate = settings.checkTimeStamp;

  const searchQuery = `is:unread after:${previousCheckDate}`;
  console.log(searchQuery)
  const searchedThreads = GmailApp.search(searchQuery);

  if (searchedThreads.length === 0) {
    console.log("There is no new email")
  }

  let msgs = "";

  searchedThreads.forEach((thread) => {
    let threadId = thread.getId();
    let messages = thread.getMessages();

    messages.forEach((message) => {
      let subject = message.getSubject();
      let sender = message.getFrom();
      let body = message.getPlainBody();

      msgs += `
        Subject: ${subject}
        Sender: ${sender}
        Body: ${body}
      `;

      message.reply("Got your email, Lancelot!")
    });
  });

  const updatedSettings = {
    ...settings,
    checkTimeStamp: currentTimestamp,
  };

  saveSettings(updatedSettings);

  if (msgs !== "") {
    const blobDoc = Utilities.newBlob(msgs, 'text/plain', `${USERNAME}-emails.txt`);
    sendFileTG(blobDoc);
  } else {
    console.log("There is no new email")
  }

  console.log("getUnreadMessages was executed successfully");
  msgs = "";
};

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


function pushingNewThreadIds() {
  let arr = [{1704969740: "thread_1704969760"}, {1704969788: "thread_1704969799"}];
  let newThreads = [{1704969836: "thread_1704969842"}, {1704969855: "thread_1704969863"}];

  console.log(`Before pushing new objects: ${JSON.stringify(arr)}`);

  arr.push(...newThreads);

  console.log(`After pushing new objects: ${JSON.stringify(arr)}`);
}


function gorilla() {
  let output = 
  {"object":"list","data":[{"id":"msg_26VP2hfXhH6Mtce8YUUcr8mT","object":"thread.message","created_at":1704992217,"thread_id":"thread_GVBaZJLdi79VeN46yuU5Zp0O","role":"assistant","content":[{"type":"text","text":{"value":"Subject: Re: History Saving Problem\n\nDear [Recipient's Name],\n\nI hope this email finds you well. I am writing in response to your inquiry about the app's search history not being saved and how to retain your search records.\n\nTo assist you effectively, could you please provide us with more details regarding the app's name and the specific issues you are encountering? Understanding the context in which the problem occurs will greatly help us in providing you with the appropriate steps or solutions. Additionally, if possible, please specify the type of device you are using as this may affect the troubleshooting process.\n\nThank you for bringing this matter to our attention. We are committed to assisting you and ensuring that your experience with our app is satisfactory.\n\nLooking forward to your response with the requested details.\n\nBest regards,\nZeva Solutions Support Team\n\nOn Thu, 11 Jan 2024 20:34:24 +0500, you wrote:\n> App's search history not saving, how can I retain my search records?","annotations":[]}}],"file_ids":[],"assistant_id":"asst_MRu5ERbhhIkbaKMygeFQhxR5","run_id":"run_wX1htB3N0La05ngHICkUFJyZ","metadata":{}},{"id":"msg_HaTX7WuUcA76sYiVh4nREmwT","object":"thread.message","created_at":1704992211,"thread_id":"thread_GVBaZJLdi79VeN46yuU5Zp0O","role":"user","content":[{"type":"text","text":{"value":"Delivered-To: zeva.slt@gmail.com\r\nReceived: by 2002:a05:6022:583:b0:4b:f69:d874 with SMTP id bn3csp1573110lab;\r\n        Thu, 11 Jan 2024 07:34:36 -0800 (PST)\r\nX-Received: by 2002:a81:a0d6:0:b0:5ee:dae9:58c6 with SMTP id x205-20020a81a0d6000000b005eedae958c6mr813031ywg.38.1704987275935;\r\n        Thu, 11 Jan 2024 07:34:35 -0800 (PST)\r\nARC-Seal: i=1; a=rsa-sha256; t=1704987275; cv=none;\r\n        d=google.com; s=arc-20160816;\r\n        b=jZ0LIuTldQBSWYS4cjhPhCTmINecJGMgwrRDfdhKUf57YQak2ZuPfSwRD+Y4ySeY3r\r\n         z8NRp/63uwTE/aULs+xHuvr3XDGXWAtFDue/d+HGxP5SE9BOmRnBl259kq+eTxa/934o\r\n         nB1B6PGmvA3DqWlKX6XO+tJHHwu5oJExy2YOg92QsTuifT3/Cd9JuiWEE7ooEiihnaVo\r\n         8ea0C+rpFmHdsQziHpdsBEXQ4YV/V5Ge2iIztdIA/P+mpSXLBy96FHb+8Rv6kXvpQscb\r\n         FXv/H2ZlHimxWJq6cCNoxYo6zmMnLCrGCQKYSZFIYoshuUifJNKonO4YQ0U0p63JfgmV\r\n         kl2w==\r\nARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20160816;\r\n        h=to:subject:message-id:date:from:mime-version:dkim-signature;\r\n        bh=a/HcgNp0xNq4/gmlBcYkJ+Dkgg1+46ZeW88SGROheug=;\r\n        fh=7a5hzOp29BLkKttmU8bDVHy9cnNPXoFaZDweZqtaX3E=;\r\n        b=MfoziafChxdaGkheegZMh88gkIJsiEK3w0R5OWcUHukWjqM7paWBrzcbFZsw4KS8mc\r\n         8hVX0VwobLDVv3ABRGaun0HxcEUMTCrnUDS+t3iofkxueOlDtz2x/iDCQlPp19D+9l85\r\n         x5QVmnjM4CI2Z4E+1Ra8GOe99bCSOviG5jy2NlrPyrl4nYnTSc3nIFWtg5EZSd5QSQzs\r\n         71IsGLRISieDQc/HzFUvzOw6Bm3S+lmoq9iZZhTTG7oZAA0r42Bk8umcAlCld+h4AhPy\r\n         HHJOm5t1VJzvfgYKknT0B3yGzpIALchr1DRQ3+7ltxq6hF7g0bDimunKRty7edBwoCsu\r\n         RNOw==\r\nARC-Authentication-Results: i=1; mx.google.com;\r\n       dkim=pass header.i=@gmail.com header.s=20230601 header.b=Z0plIKPg;\r\n       spf=pass (google.com: domain of khabib.khx@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=khabib.khx@gmail.com;\r\n       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com\r\nReturn-Path: <khabib.khx@gmail.com>\r\nReceived: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41])\r\n        by mx.google.com with SMTPS id o93-20020a9f3566000000b007cd127ab710sor390407uao.1.2024.01.11.07.34.35\r\n        for <zeva.slt@gmail.com>\r\n        (Google Transport Security);\r\n        Thu, 11 Jan 2024 07:34:35 -0800 (PST)\r\nReceived-SPF: pass (google.com: domain of khabib.khx@gmail.com designates 209.85.220.41 as permitted sender) client-ip=209.85.220.41;\r\nAuthentication-Results: mx.google.com;\r\n       dkim=pass header.i=@gmail.com header.s=20230601 header.b=Z0plIKPg;\r\n       spf=pass (google.com: domain of khabib.khx@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=khabib.khx@gmail.com;\r\n       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com\r\nDKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\r\n        d=gmail.com; s=20230601; t=1704987275; x=1705592075; dara=google.com;\r\n        h=to:subject:message-id:date:from:mime-version:from:to:cc:subject\r\n         :date:message-id:reply-to;\r\n        bh=a/HcgNp0xNq4/gmlBcYkJ+Dkgg1+46ZeW88SGROheug=;\r\n        b=Z0plIKPgd+QulJWNxplfcvor2excvnA+mo3XSboryI2xwS0tVOEtGob1Y5Fk6IjIC2\r\n         YPwW+8/qcBC34PNiVh1o5JzA9ce+cf94MsL1ZsDKIzC6TTCS7SJGq4aBBW8kfVkv9TdN\r\n         N2+qZuV+oVo+3Pf481ylbJL2qJhSJbAR/Uzvq7PgXQJDQiSFmr71+DyZFS4dgdL6zeQ0\r\n         vjpsltaL3pBtHusP/bMbvsDtADW0pVsF75Jw0+eAabbNNVlGbE7JeDAzoUTQtd/o07Dd\r\n         9kWC9MpjA6DwUYXvlCUW7myYVvom0z8beXINYy548NUmvMEMbso+3o+kNtSfpse3m3Em\r\n         P3nQ==\r\nX-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\r\n        d=1e100.net; s=20230601; t=1704987275; x=1705592075;\r\n        h=to:subject:message-id:date:from:mime-version:x-gm-message-state\r\n         :from:to:cc:subject:date:message-id:reply-to;\r\n        bh=a/HcgNp0xNq4/gmlBcYkJ+Dkgg1+46ZeW88SGROheug=;\r\n        b=X0VRVn07RgRDvr/V55Eb4x1K4Eq4mhAHp5HdsC8zYUpb7LAkIRoDYjxto17ksbtbnH\r\n         84VAF9P1s1iS+sZb1dge5kOj9SaP9RQvlCWKt87I6GqdhHxCqHkKAeFWRyaGr85StewM\r\n         HzofcT842udvDC62JLXuid80AgO+7n4FyWx25f8xC/7x2snBmg9toeZ+s8TIgsYEiR5y\r\n         PqRCWMH3rAvVlZ0BApCqXRSTsffZi3Y/7chh/VnX7WekS64s9B3zGKfG6bwyDKZG6Wuc\r\n         XV/shzRnbk4O0D3vrCbtzSNRA36IX3ee4N7Azr7dirNOzTbli0fH5ZR4B9Kkwno7QedB\r\n         tsfw==\r\nX-Gm-Message-State: AOJu0YxUUnAzqAFi39JGVi642SRdp0h2CKpXyZGlMC538dIeSzMAFZrx\r\n\tOjIDCUTmATm8YxR0ItnpbLdQOLnnQgBGDd3xa6+LqsOmQ5a5sg==\r\nX-Google-Smtp-Source: AGHT+IGhUqew2i5gex7G6wzpoY4GoG4RWHfzSLYd9I59IBdATaxkiLxagN69DYveleI6Kc1Xp8AGaQJJ/j8y198AYsY=\r\nX-Received: by 2002:a05:6122:4d08:b0:4b7:7000:cafd with SMTP id\r\n fi8-20020a0561224d0800b004b77000cafdmr646519vkb.26.1704987275389; Thu, 11 Jan\r\n 2024 07:34:35 -0800 (PST)\r\nMIME-Version: 1.0\r\nFrom: =?UTF-8?B?0KXQsNCx0LjQsdGD0LvQu9C+0YXQvtC9INCl0LDQudGA0YPQu9C70L7RhdC+0LTQttCw0LXQsg==?= <khabib.khx@gmail.com>\r\nDate: Thu, 11 Jan 2024 20:34:24 +0500\r\nMessage-ID: <CACtQroKB-Ose9T58js-3xkKVz7DE3JJpFVFGaYUK00=3Bqs2hw@mail.gmail.com>\r\nSubject: History saving problem\r\nTo: Zeva Solutions <zeva.slt@gmail.com>\r\nContent-Type: multipart/alternative; boundary=\"000000000000e570a6060ead4826\"\r\n\r\n--000000000000e570a6060ead4826\r\nContent-Type: text/plain; charset=\"UTF-8\"\r\n\r\nApp's search history not saving, how can I retain my search records?\r\n\r\n--000000000000e570a6060ead4826\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n<div dir=\"ltr\">App&#39;s search history not saving, how can I retain my search records?<br></div>\r\n\r\n--000000000000e570a6060ead4826--\r\n","annotations":[]}}],"file_ids":[],"assistant_id":null,"run_id":null,"metadata":{}},{"id":"msg_jZp8BADa6zgFTCijtLZQ4geZ","object":"thread.message","created_at":1704992005,"thread_id":"thread_GVBaZJLdi79VeN46yuU5Zp0O","role":"assistant","content":[{"type":"text","text":{"value":"Subject: Assistance with Saving Search History\n\nDear [Recipient's Name],\n\nI hope this email finds you well. I am writing in response to your inquiry about the issue you're experiencing with the app's search history not being saved. To assist you effectively, could I please ask you to provide us with more details regarding the app's name and the specific issues you are encountering?\n\nUnderstanding the context in which the problem occurs will greatly help us in providing you with the appropriate steps or solutions. Additionally, if possible, please specify the type of device you are using as this may also affect the troubleshooting process.\n\nThank you for bringing this matter to our attention. We are committed to assisting you and ensuring that your experience with our app is satisfactory.\n\nLooking forward to your response with the requested details.\n\nBest regards,\nZeva Solutions Support Team","annotations":[]}}],"file_ids":[],"assistant_id":"asst_MRu5ERbhhIkbaKMygeFQhxR5","run_id":"run_YcsqWTsyE1sYxTS4gCmN251u","metadata":{}},{"id":"msg_38yJtXa2TAmZjlJ3Tvmie3RA","object":"thread.message","created_at":1704991999,"thread_id":"thread_GVBaZJLdi79VeN46yuU5Zp0O","role":"user","content":[{"type":"text","text":{"value":"Delivered-To: zeva.slt@gmail.com\r\nReceived: by 2002:a05:6022:583:b0:4b:f69:d874 with SMTP id bn3csp1573110lab;\r\n        Thu, 11 Jan 2024 07:34:36 -0800 (PST)\r\nX-Received: by 2002:a81:a0d6:0:b0:5ee:dae9:58c6 with SMTP id x205-20020a81a0d6000000b005eedae958c6mr813031ywg.38.1704987275935;\r\n        Thu, 11 Jan 2024 07:34:35 -0800 (PST)\r\nARC-Seal: i=1; a=rsa-sha256; t=1704987275; cv=none;\r\n        d=google.com; s=arc-20160816;\r\n        b=jZ0LIuTldQBSWYS4cjhPhCTmINecJGMgwrRDfdhKUf57YQak2ZuPfSwRD+Y4ySeY3r\r\n         z8NRp/63uwTE/aULs+xHuvr3XDGXWAtFDue/d+HGxP5SE9BOmRnBl259kq+eTxa/934o\r\n         nB1B6PGmvA3DqWlKX6XO+tJHHwu5oJExy2YOg92QsTuifT3/Cd9JuiWEE7ooEiihnaVo\r\n         8ea0C+rpFmHdsQziHpdsBEXQ4YV/V5Ge2iIztdIA/P+mpSXLBy96FHb+8Rv6kXvpQscb\r\n         FXv/H2ZlHimxWJq6cCNoxYo6zmMnLCrGCQKYSZFIYoshuUifJNKonO4YQ0U0p63JfgmV\r\n         kl2w==\r\nARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20160816;\r\n        h=to:subject:message-id:date:from:mime-version:dkim-signature;\r\n        bh=a/HcgNp0xNq4/gmlBcYkJ+Dkgg1+46ZeW88SGROheug=;\r\n        fh=7a5hzOp29BLkKttmU8bDVHy9cnNPXoFaZDweZqtaX3E=;\r\n        b=MfoziafChxdaGkheegZMh88gkIJsiEK3w0R5OWcUHukWjqM7paWBrzcbFZsw4KS8mc\r\n         8hVX0VwobLDVv3ABRGaun0HxcEUMTCrnUDS+t3iofkxueOlDtz2x/iDCQlPp19D+9l85\r\n         x5QVmnjM4CI2Z4E+1Ra8GOe99bCSOviG5jy2NlrPyrl4nYnTSc3nIFWtg5EZSd5QSQzs\r\n         71IsGLRISieDQc/HzFUvzOw6Bm3S+lmoq9iZZhTTG7oZAA0r42Bk8umcAlCld+h4AhPy\r\n         HHJOm5t1VJzvfgYKknT0B3yGzpIALchr1DRQ3+7ltxq6hF7g0bDimunKRty7edBwoCsu\r\n         RNOw==\r\nARC-Authentication-Results: i=1; mx.google.com;\r\n       dkim=pass header.i=@gmail.com header.s=20230601 header.b=Z0plIKPg;\r\n       spf=pass (google.com: domain of khabib.khx@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=khabib.khx@gmail.com;\r\n       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com\r\nReturn-Path: <khabib.khx@gmail.com>\r\nReceived: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41])\r\n        by mx.google.com with SMTPS id o93-20020a9f3566000000b007cd127ab710sor390407uao.1.2024.01.11.07.34.35\r\n        for <zeva.slt@gmail.com>\r\n        (Google Transport Security);\r\n        Thu, 11 Jan 2024 07:34:35 -0800 (PST)\r\nReceived-SPF: pass (google.com: domain of khabib.khx@gmail.com designates 209.85.220.41 as permitted sender) client-ip=209.85.220.41;\r\nAuthentication-Results: mx.google.com;\r\n       dkim=pass header.i=@gmail.com header.s=20230601 header.b=Z0plIKPg;\r\n       spf=pass (google.com: domain of khabib.khx@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=khabib.khx@gmail.com;\r\n       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com\r\nDKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\r\n        d=gmail.com; s=20230601; t=1704987275; x=1705592075; dara=google.com;\r\n        h=to:subject:message-id:date:from:mime-version:from:to:cc:subject\r\n         :date:message-id:reply-to;\r\n        bh=a/HcgNp0xNq4/gmlBcYkJ+Dkgg1+46ZeW88SGROheug=;\r\n        b=Z0plIKPgd+QulJWNxplfcvor2excvnA+mo3XSboryI2xwS0tVOEtGob1Y5Fk6IjIC2\r\n         YPwW+8/qcBC34PNiVh1o5JzA9ce+cf94MsL1ZsDKIzC6TTCS7SJGq4aBBW8kfVkv9TdN\r\n         N2+qZuV+oVo+3Pf481ylbJL2qJhSJbAR/Uzvq7PgXQJDQiSFmr71+DyZFS4dgdL6zeQ0\r\n         vjpsltaL3pBtHusP/bMbvsDtADW0pVsF75Jw0+eAabbNNVlGbE7JeDAzoUTQtd/o07Dd\r\n         9kWC9MpjA6DwUYXvlCUW7myYVvom0z8beXINYy548NUmvMEMbso+3o+kNtSfpse3m3Em\r\n         P3nQ==\r\nX-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\r\n        d=1e100.net; s=20230601; t=1704987275; x=1705592075;\r\n        h=to:subject:message-id:date:from:mime-version:x-gm-message-state\r\n         :from:to:cc:subject:date:message-id:reply-to;\r\n        bh=a/HcgNp0xNq4/gmlBcYkJ+Dkgg1+46ZeW88SGROheug=;\r\n        b=X0VRVn07RgRDvr/V55Eb4x1K4Eq4mhAHp5HdsC8zYUpb7LAkIRoDYjxto17ksbtbnH\r\n         84VAF9P1s1iS+sZb1dge5kOj9SaP9RQvlCWKt87I6GqdhHxCqHkKAeFWRyaGr85StewM\r\n         HzofcT842udvDC62JLXuid80AgO+7n4FyWx25f8xC/7x2snBmg9toeZ+s8TIgsYEiR5y\r\n         PqRCWMH3rAvVlZ0BApCqXRSTsffZi3Y/7chh/VnX7WekS64s9B3zGKfG6bwyDKZG6Wuc\r\n         XV/shzRnbk4O0D3vrCbtzSNRA36IX3ee4N7Azr7dirNOzTbli0fH5ZR4B9Kkwno7QedB\r\n         tsfw==\r\nX-Gm-Message-State: AOJu0YxUUnAzqAFi39JGVi642SRdp0h2CKpXyZGlMC538dIeSzMAFZrx\r\n\tOjIDCUTmATm8YxR0ItnpbLdQOLnnQgBGDd3xa6+LqsOmQ5a5sg==\r\nX-Google-Smtp-Source: AGHT+IGhUqew2i5gex7G6wzpoY4GoG4RWHfzSLYd9I59IBdATaxkiLxagN69DYveleI6Kc1Xp8AGaQJJ/j8y198AYsY=\r\nX-Received: by 2002:a05:6122:4d08:b0:4b7:7000:cafd with SMTP id\r\n fi8-20020a0561224d0800b004b77000cafdmr646519vkb.26.1704987275389; Thu, 11 Jan\r\n 2024 07:34:35 -0800 (PST)\r\nMIME-Version: 1.0\r\nFrom: =?UTF-8?B?0KXQsNCx0LjQsdGD0LvQu9C+0YXQvtC9INCl0LDQudGA0YPQu9C70L7RhdC+0LTQttCw0LXQsg==?= <khabib.khx@gmail.com>\r\nDate: Thu, 11 Jan 2024 20:34:24 +0500\r\nMessage-ID: <CACtQroKB-Ose9T58js-3xkKVz7DE3JJpFVFGaYUK00=3Bqs2hw@mail.gmail.com>\r\nSubject: History saving problem\r\nTo: Zeva Solutions <zeva.slt@gmail.com>\r\nContent-Type: multipart/alternative; boundary=\"000000000000e570a6060ead4826\"\r\n\r\n--000000000000e570a6060ead4826\r\nContent-Type: text/plain; charset=\"UTF-8\"\r\n\r\nApp's search history not saving, how can I retain my search records?\r\n\r\n--000000000000e570a6060ead4826\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n<div dir=\"ltr\">App&#39;s search history not saving, how can I retain my search records?<br></div>\r\n\r\n--000000000000e570a6060ead4826--\r\n","annotations":[]}}],"file_ids":[],"assistant_id":null,"run_id":null,"metadata":{}},{"id":"msg_xGGrJmzrSBiLD6PTimgvXBbs","object":"thread.message","created_at":1704991930,"thread_id":"thread_GVBaZJLdi79VeN46yuU5Zp0O","role":"user","content":[{"type":"text","text":{"value":"Delivered-To: zeva.slt@gmail.com\r\nReceived: by 2002:a05:6022:583:b0:4b:f69:d874 with SMTP id bn3csp1573110lab;\r\n        Thu, 11 Jan 2024 07:34:36 -0800 (PST)\r\nX-Received: by 2002:a81:a0d6:0:b0:5ee:dae9:58c6 with SMTP id x205-20020a81a0d6000000b005eedae958c6mr813031ywg.38.1704987275935;\r\n        Thu, 11 Jan 2024 07:34:35 -0800 (PST)\r\nARC-Seal: i=1; a=rsa-sha256; t=1704987275; cv=none;\r\n        d=google.com; s=arc-20160816;\r\n        b=jZ0LIuTldQBSWYS4cjhPhCTmINecJGMgwrRDfdhKUf57YQak2ZuPfSwRD+Y4ySeY3r\r\n         z8NRp/63uwTE/aULs+xHuvr3XDGXWAtFDue/d+HGxP5SE9BOmRnBl259kq+eTxa/934o\r\n         nB1B6PGmvA3DqWlKX6XO+tJHHwu5oJExy2YOg92QsTuifT3/Cd9JuiWEE7ooEiihnaVo\r\n         8ea0C+rpFmHdsQziHpdsBEXQ4YV/V5Ge2iIztdIA/P+mpSXLBy96FHb+8Rv6kXvpQscb\r\n         FXv/H2ZlHimxWJq6cCNoxYo6zmMnLCrGCQKYSZFIYoshuUifJNKonO4YQ0U0p63JfgmV\r\n         kl2w==\r\nARC-Message-Signature: i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20160816;\r\n        h=to:subject:message-id:date:from:mime-version:dkim-signature;\r\n        bh=a/HcgNp0xNq4/gmlBcYkJ+Dkgg1+46ZeW88SGROheug=;\r\n        fh=7a5hzOp29BLkKttmU8bDVHy9cnNPXoFaZDweZqtaX3E=;\r\n        b=MfoziafChxdaGkheegZMh88gkIJsiEK3w0R5OWcUHukWjqM7paWBrzcbFZsw4KS8mc\r\n         8hVX0VwobLDVv3ABRGaun0HxcEUMTCrnUDS+t3iofkxueOlDtz2x/iDCQlPp19D+9l85\r\n         x5QVmnjM4CI2Z4E+1Ra8GOe99bCSOviG5jy2NlrPyrl4nYnTSc3nIFWtg5EZSd5QSQzs\r\n         71IsGLRISieDQc/HzFUvzOw6Bm3S+lmoq9iZZhTTG7oZAA0r42Bk8umcAlCld+h4AhPy\r\n         HHJOm5t1VJzvfgYKknT0B3yGzpIALchr1DRQ3+7ltxq6hF7g0bDimunKRty7edBwoCsu\r\n         RNOw==\r\nARC-Authentication-Results: i=1; mx.google.com;\r\n       dkim=pass header.i=@gmail.com header.s=20230601 header.b=Z0plIKPg;\r\n       spf=pass (google.com: domain of khabib.khx@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=khabib.khx@gmail.com;\r\n       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com\r\nReturn-Path: <khabib.khx@gmail.com>\r\nReceived: from mail-sor-f41.google.com (mail-sor-f41.google.com. [209.85.220.41])\r\n        by mx.google.com with SMTPS id o93-20020a9f3566000000b007cd127ab710sor390407uao.1.2024.01.11.07.34.35\r\n        for <zeva.slt@gmail.com>\r\n        (Google Transport Security);\r\n        Thu, 11 Jan 2024 07:34:35 -0800 (PST)\r\nReceived-SPF: pass (google.com: domain of khabib.khx@gmail.com designates 209.85.220.41 as permitted sender) client-ip=209.85.220.41;\r\nAuthentication-Results: mx.google.com;\r\n       dkim=pass header.i=@gmail.com header.s=20230601 header.b=Z0plIKPg;\r\n       spf=pass (google.com: domain of khabib.khx@gmail.com designates 209.85.220.41 as permitted sender) smtp.mailfrom=khabib.khx@gmail.com;\r\n       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com\r\nDKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\r\n        d=gmail.com; s=20230601; t=1704987275; x=1705592075; dara=google.com;\r\n        h=to:subject:message-id:date:from:mime-version:from:to:cc:subject\r\n         :date:message-id:reply-to;\r\n        bh=a/HcgNp0xNq4/gmlBcYkJ+Dkgg1+46ZeW88SGROheug=;\r\n        b=Z0plIKPgd+QulJWNxplfcvor2excvnA+mo3XSboryI2xwS0tVOEtGob1Y5Fk6IjIC2\r\n         YPwW+8/qcBC34PNiVh1o5JzA9ce+cf94MsL1ZsDKIzC6TTCS7SJGq4aBBW8kfVkv9TdN\r\n         N2+qZuV+oVo+3Pf481ylbJL2qJhSJbAR/Uzvq7PgXQJDQiSFmr71+DyZFS4dgdL6zeQ0\r\n         vjpsltaL3pBtHusP/bMbvsDtADW0pVsF75Jw0+eAabbNNVlGbE7JeDAzoUTQtd/o07Dd\r\n         9kWC9MpjA6DwUYXvlCUW7myYVvom0z8beXINYy548NUmvMEMbso+3o+kNtSfpse3m3Em\r\n         P3nQ==\r\nX-Google-DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;\r\n        d=1e100.net; s=20230601; t=1704987275; x=1705592075;\r\n        h=to:subject:message-id:date:from:mime-version:x-gm-message-state\r\n         :from:to:cc:subject:date:message-id:reply-to;\r\n        bh=a/HcgNp0xNq4/gmlBcYkJ+Dkgg1+46ZeW88SGROheug=;\r\n        b=X0VRVn07RgRDvr/V55Eb4x1K4Eq4mhAHp5HdsC8zYUpb7LAkIRoDYjxto17ksbtbnH\r\n         84VAF9P1s1iS+sZb1dge5kOj9SaP9RQvlCWKt87I6GqdhHxCqHkKAeFWRyaGr85StewM\r\n         HzofcT842udvDC62JLXuid80AgO+7n4FyWx25f8xC/7x2snBmg9toeZ+s8TIgsYEiR5y\r\n         PqRCWMH3rAvVlZ0BApCqXRSTsffZi3Y/7chh/VnX7WekS64s9B3zGKfG6bwyDKZG6Wuc\r\n         XV/shzRnbk4O0D3vrCbtzSNRA36IX3ee4N7Azr7dirNOzTbli0fH5ZR4B9Kkwno7QedB\r\n         tsfw==\r\nX-Gm-Message-State: AOJu0YxUUnAzqAFi39JGVi642SRdp0h2CKpXyZGlMC538dIeSzMAFZrx\r\n\tOjIDCUTmATm8YxR0ItnpbLdQOLnnQgBGDd3xa6+LqsOmQ5a5sg==\r\nX-Google-Smtp-Source: AGHT+IGhUqew2i5gex7G6wzpoY4GoG4RWHfzSLYd9I59IBdATaxkiLxagN69DYveleI6Kc1Xp8AGaQJJ/j8y198AYsY=\r\nX-Received: by 2002:a05:6122:4d08:b0:4b7:7000:cafd with SMTP id\r\n fi8-20020a0561224d0800b004b77000cafdmr646519vkb.26.1704987275389; Thu, 11 Jan\r\n 2024 07:34:35 -0800 (PST)\r\nMIME-Version: 1.0\r\nFrom: =?UTF-8?B?0KXQsNCx0LjQsdGD0LvQu9C+0YXQvtC9INCl0LDQudGA0YPQu9C70L7RhdC+0LTQttCw0LXQsg==?= <khabib.khx@gmail.com>\r\nDate: Thu, 11 Jan 2024 20:34:24 +0500\r\nMessage-ID: <CACtQroKB-Ose9T58js-3xkKVz7DE3JJpFVFGaYUK00=3Bqs2hw@mail.gmail.com>\r\nSubject: History saving problem\r\nTo: Zeva Solutions <zeva.slt@gmail.com>\r\nContent-Type: multipart/alternative; boundary=\"000000000000e570a6060ead4826\"\r\n\r\n--000000000000e570a6060ead4826\r\nContent-Type: text/plain; charset=\"UTF-8\"\r\n\r\nApp's search history not saving, how can I retain my search records?\r\n\r\n--000000000000e570a6060ead4826\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n<div dir=\"ltr\">App&#39;s search history not saving, how can I retain my search records?<br></div>\r\n\r\n--000000000000e570a6060ead4826--\r\n","annotations":[]}}],"file_ids":[],"assistant_id":null,"run_id":null,"metadata":{}}],"first_id":"msg_26VP2hfXhH6Mtce8YUUcr8mT","last_id":"msg_xGGrJmzrSBiLD6PTimgvXBbs","has_more":false}
  console.log(JSON.parse(output))
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