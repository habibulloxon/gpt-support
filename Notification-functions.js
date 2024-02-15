const sendSummaryAndAssistantCreationEmail = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let fileLink = addonSettings.docsFileLink;
  let assistantId = addonSettings.assistantId;

  const email = Session.getActiveUser().getEmail();
  const subject = `${ADDON_TITLE} - summary created`;
  const template = HtmlService.createTemplateFromFile(
    "creation-notification.html"
  );

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `
      <p><b>Knowledge base</b></p>
      <a href=${fileLink}>Click here to view file</a>
  
      <p>Assistant ID:</p>
      <p>${assistantId}</p>
    `;

  htmlOutput = htmlOutput.replace("{{content}}", resultHTML);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: ADDON_TITLE,
    htmlBody: htmlOutput,
  });

  console.log("Sent!");
};

const sendAssistantFileUPdatedEmail = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let fileLink = addonSettings.docsFileLink;
  let fileId = addonSettings.fileId;

  const email = Session.getActiveUser().getEmail();
  const subject = `${ADDON_TITLE} - assistant file updated`;
  const template = HtmlService.createTemplateFromFile(
    "assistant-file-update-notification.html"
  );

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `
      <p><b>Knowledge base file</b></p>
      <a href=${fileLink}>Click here to view file</a>
  
      <p>New file ID:</p>
      <p>${fileId}</p>
    `;

  htmlOutput = htmlOutput.replace("{{content}}", resultHTML);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: ADDON_TITLE,
    htmlBody: htmlOutput,
  });

  console.log("Sent!");
};

const sendSummaryUpdateEmail = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let fileLink = addonSettings.docsFileLink;

  const email = Session.getActiveUser().getEmail();
  const subject = `${ADDON_TITLE} - summary updated`;
  const template = HtmlService.createTemplateFromFile(
    "summary-update-notification.html"
  );

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `<a href=${fileLink}>Click here to view knowledge base file</a>`;

  htmlOutput = htmlOutput.replace("{{link}}", resultHTML);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: ADDON_TITLE,
    htmlBody: htmlOutput,
  });

  console.log("Sent!");
};
