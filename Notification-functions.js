function sendAllEmails() {
  sendSummaryAndAssistantCreationEmail()
  sendAssistantFileUPdatedEmail()
  sendSummaryUpdateEmail()
}

const sendSummaryAndAssistantCreationEmail = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let fileLink = addonSettings.docsFileLink;
  let assistantId = addonSettings.assistantId;

  const email = Session.getActiveUser().getEmail();
  const subject = `${ADDON_TITLE} - knowledge base created`;
  const template = HtmlService.createTemplateFromFile(
    "creation-notification.html"
  );

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `
      <a href="${fileLink}" class="btn">View Your Knowledge Base</a>
      <p>If you need any assistance or have questions, feel free to reach out.</p>
      <div class="footer">
      <p>Your Assistant ID: <strong>${assistantId}</strong></p>
      </div>
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
      <a href="${fileLink}">View knowledge base</a>

<div class="footer">
    <p>New File ID: <strong>${fileId}</strong></p>
</div>
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
  const subject = `${ADDON_TITLE} - knowledge base updated`;
  const template = HtmlService.createTemplateFromFile(
    "summary-update-notification.html"
  );

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `<a href="${fileLink}" class="btn">View latest knowledge base</a>`;

  htmlOutput = htmlOutput.replace("{{link}}", resultHTML);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: ADDON_TITLE,
    htmlBody: htmlOutput,
  });

  console.log("Sent!");
};
