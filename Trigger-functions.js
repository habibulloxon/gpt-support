const installTimeDrivenTrigger = () => {
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

  return timeDrivenTriggerExists
};

const installSummaryCreationTriggers = () => {
  ScriptApp.newTrigger("createInboxSummary")
    .timeBased()
    .at(new Date((getCurrentTimeStamp() + 1) * 1000))
    .create();

  ScriptApp.newTrigger("checkSummaryCreatingStatus")
    .timeBased()
    .at(new Date((getCurrentTimeStamp() + 2) * 1000))
    .create();
};

const installSummaryUpdateTriggers = () => {
  ScriptApp.newTrigger("updateInboxSummary")
    .timeBased()
    .at(new Date((getCurrentTimeStamp() + 1) * 1000))
    .create();

  ScriptApp.newTrigger("checkSummaryUpdateStatus")
    .timeBased()
    .at(new Date((getCurrentTimeStamp() + 3) * 1000))
    .create();
};

function test() {
  console.log(new Date((getCurrentTimeStamp() + 1) * 1000))
}

const deleteTriggers = () => {
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
};