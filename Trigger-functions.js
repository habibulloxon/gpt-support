const installTimeDrivenTrigger = () => {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let timeDrivenTriggerExists = false;
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getEventType() === ScriptApp.EventType.CLOCK) {
        timeDrivenTriggerExists = true;
        break;
      }
    }
    if (!timeDrivenTriggerExists) {
      ScriptApp.newTrigger("replyUnredMessages")
        .timeBased()
        .everyHours(1)
        .create();
    }
    console.log("replyUnredMessages was installed as a trigger")
  } catch (error) {
    console.error("Error in installing replyUnreadMessages trigger:", error.name);
  }
};

const installSummaryCreationTriggers = () => {
  ScriptApp.newTrigger("createInboxSummary")
    .timeBased()
    .at(new Date((getCurrentTimeStamp() + 1) * 1000))
    .create();
  console.log("creation functions were added as a triggers")
};

const installSummaryUpdateTriggers = () => {
  ScriptApp.newTrigger("updateInboxSummary")
    .timeBased()
    .at(new Date((getCurrentTimeStamp() + 1) * 1000))
    .create();
};

const deleteTriggers = () => {
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
};