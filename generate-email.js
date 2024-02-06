const generateEmail = (e) => {
  let inputValue = e.formInput.prompt_input;
  let styleValue = e.formInput.style_select;
  let modelValue = e.formInput.model_select;

  console.log("Input value: ", inputValue)
  console.log("Selected style: ", styleValue)
  console.log("Selected model: ", modelValue)

  let text = `Input value: ${inputValue}\nSelected style: ${styleValue}\nSelected model: ${modelValue}`;
}


const onEmailCompose = () => {
  const userProperties = PropertiesService.getUserProperties();

  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  const isAssistantCreated = booleanSettings.isAssistantCreated;

  const cardSection = CardService.newCardSection();

  const generateEmailAction = CardService.newAction().setFunctionName(
    "generateEmail"
  );

  if (isAssistantCreated) {
    const promptInput = CardService.newTextInput()
      .setFieldName("prompt_input")
      .setTitle("Redact your prompt is here (e.g)")
      .setSuggestions(CardService.newSuggestions()
        .addSuggestion("I'm interested")
        .addSuggestion("I'm not interested"))
    cardSection.addWidget(promptInput)

    const styleSelect = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle("Choose style:")
      .setFieldName("style_select")
      .addItem("Formal", "formal_style", true)
      .addItem("Casual", "casual_style", false)
    cardSection.addWidget(styleSelect)

    const modelSelect = CardService.newSelectionInput()
      .setType(CardService.SelectionInputType.DROPDOWN)
      .setTitle("Select LLM model:")
      .setFieldName("model_select")
      .addItem("gpt-3.5", "gpt-3.5", true)
      .addItem("gpt-4", "gpt-4", false)
      .addItem("gpt-4-turbo", "gpt-4-turbo", false)
    cardSection.addWidget(modelSelect)

    const generateBtn = CardService.newTextButton()
      .setText("Generate email")
      .setOnClickAction(generateEmailAction)
    cardSection.addWidget(generateBtn);
  } else {
    const errorText = CardService.newTextParagraph().setText(
      "Error, firstly create assistant"
    );
    cardSection.addWidget(errorText);
  }

  const card = CardService.newCardBuilder()
    .setName("Email generation")
    .setHeader(
      CardService.newCardHeader().setTitle("Generate email")
    )
    .addSection(cardSection)
    .build();
  return card;
};
