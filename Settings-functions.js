const saveSettings = (settings) => {
  try {
    let userProperties = PropertiesService.getUserProperties();
    if (settings) {
      userProperties.setProperty("settingsAPB", JSON.stringify(settings));
      console.log(`Settings in ${ADDON_TITLE} were saved successfully.`);
    } else {
      console.error("Error: 'settings' is null or undefined.");
    }
    let temp = userProperties.getProperty("settingsAPB");
    let parsedSettings = JSON.parse(temp);
    console.log("Settings: ", parsedSettings);
    refreshCard();
  } catch (error) {
    console.error("Error saving or retrieving settings:", error);
  }
};

const saveSettingsFlags = (settings) => {
  try {
    let userProperties = PropertiesService.getUserProperties();
    if (settings) {
      userProperties.setProperty("settingsFlags", JSON.stringify(settings));
      console.log("Settings were successfully saved in settingsFlags");
    } else {
      console.error("Error: 'settings' is null or undefined.");
    }

    let settingsToLog = JSON.parse(userProperties.getProperty("settingsFlags"));
    console.log("settingsFlags: ", settingsToLog);
  } catch {
    console.error(
      "Error saving or retrieving settings in settingsFlags:",
      error
    );
  }
};

const saveSettingsUserInfo = (settings) => {
  try {
    let userProperties = PropertiesService.getUserProperties();
    if (settings) {
      userProperties.setProperty("settingsUserInfo", JSON.stringify(settings));
      console.log("Settings were successfully saved in settingsUserInfo");
    } else {
      console.error("Error: 'settings' is null or undefined.");
    }

    let settingsToLog = JSON.parse(
      userProperties.getProperty("settingsUserInfo")
    );
    console.log("settingsUserInfo: ", settingsToLog);
  } catch {
    console.error(
      "Error saving or retrieving settings in settingsUserInfo:",
      error
    );
  }
};

const saveSettingsAddon = (settings) => {
  try {
    let userProperties = PropertiesService.getUserProperties();
    if (settings) {
      userProperties.setProperty("settingsAddon", JSON.stringify(settings));
      console.log("Settings were successfully saved in settingsAddon");
    } else {
      console.error("Error: 'settings' is null or undefined.");
    }

    let settingsToLog = JSON.parse(userProperties.getProperty("settingsAddon"));
    console.log("settingsAddon: ", settingsToLog);
  } catch {
    console.error(
      "Error saving or retrieving settings in settingsAddon:",
      error
    );
  }
};

const createSettings = () => {
  let pastTimestamp = getPastTimeStamp();

  let userProperties = PropertiesService.getUserProperties();
  let settings = userProperties.getProperty("settingsAPB");

  let isUserPropsExist;
  if (settings !== null && settings !== undefined) {
    isUserPropsExist = true;
  } else {
    isUserPropsExist = false;
  }

  let updatedSettings = {};

  if (!isUserPropsExist) {
    updatedSettings = {
      assistantName: "Zeva",
      openAiApiKey: "",
      companyName: "",
      emailsLimit: 100,
      autoReply: "true",
      mainFunctionStatus: "idle",
      isApiKeyValid: false,
      updateFunctionStatus: "idle",
      fileId: "",
      assistantId: "",
      docsFileId: "",
      docsFileLink: "",
      lastUpdatedDate: "",
      isFileUpdated: false,
      isAssistantCreated: false,
      threadIds: [],
      checkTimeStamp: pastTimestamp,
    };
    saveSettings(updatedSettings);

    console.log("Settings were created");
  } else {
    let docStatus = compareUpdatedDates();
    updatedSettings = {
      ...settings,
      isFileUpdated: docStatus,
    };
    saveSettings(updatedSettings);
  }
};
