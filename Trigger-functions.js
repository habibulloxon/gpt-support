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

const installMinuteDrivenTrigger = () => {
  ScriptApp.newTrigger("createInboxSummary")
    .timeBased()
    .at(new Date((getCurrentTimeStamp() + 1) * 1000 ))
    .create();
};

const deleteTriggers = () => {
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
};