import { Dispatch, useState } from "react";
import { ImageInput } from "./ImageInput";
import { LanguageInputList } from "./LanguageInputList";
import { LanguageSelector } from "./LanguageSelector";
import { TextField } from "./TextField";
import { WordFormAction, WordFormState } from "../hooks/useWordForm";

type Props = {
  state: WordFormState;
  dispatch: Dispatch<WordFormAction>;
  canSaveWord: boolean;
  onSave: () => void;
  error?: string;
};

export const WordForm = ({
  state,
  dispatch,
  canSaveWord,
  onSave,
  error,
}: Props) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const canSave = canSaveWord && !isUploadingImage;

  return (
    <div className="m-2">
      <div className="flex">
        <TextField
          autoFocus={true}
          tabIndex={0}
          placeholder="Word or phrase"
          value={state.word}
          onTextChange={(word) => dispatch({ type: "SetWord", word })}
        />
        <ImageInput
          tabIndex={1}
          imageUrl={state.imageUrl}
          onImageUrlChange={(imageUrl) =>
            dispatch({ type: "SetImageUrl", imageUrl })
          }
          onUploadingChange={setIsUploadingImage}
        />
        <LanguageSelector
          language={state.language}
          onLanguageChange={(lang) => dispatch({ type: "SetLanguage", lang })}
        />
      </div>

      <LanguageInputList
        languageValues={state.translations}
        onChange={(translations) =>
          dispatch({ type: "SetTranslations", translations })
        }
        type="input"
      />
      <LanguageInputList
        languageValues={state.explanations}
        onChange={(explanations) =>
          dispatch({ type: "SetExplanations", explanations })
        }
        title="Explanations"
      />
      <LanguageInputList
        languageValues={state.usages}
        onChange={(usages) => dispatch({ type: "SetUsages", usages })}
        title="Usages"
      />

      <button
        className={`${
          !canSave ? "bg-gray-300" : "bg-violet-500 hover:bg-violet-700"
        } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}
        disabled={!canSave}
        onClick={onSave}
      >
        Save 💾
      </button>
      {error ? <div className="text-red-700">{error}</div> : null}
    </div>
  );
};
