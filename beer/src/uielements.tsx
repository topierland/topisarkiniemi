import React, {useEffect, useRef, useState} from "react";

interface DynamicInputProps {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    height: number;
}

export const DynamicInput: React.FC<DynamicInputProps> = ({placeholder, value,height, onChange}) => {
    const [textareaContentRows, setTextareaContentRows] = useState(1);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Call setTextareaHeight initially to adjust the height based on the initial value
        if (textareaRef.current) {
            setTextareaHeight(textareaRef.current);
        }
    }, [value]);

    const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
        if (textareaRef.current) {
            setTextareaHeight(textareaRef.current);
        }
    };

    const setTextareaHeight = (textarea: HTMLTextAreaElement) => {
        const lineHeight = height;
        const minRows = 1;
        const previousRows = textarea.rows
        textarea.rows = minRows; // reset rows for decreasing textarea
        const currentRows = Math.round((textarea.scrollHeight) / lineHeight)
        if (currentRows === previousRows) {
            textarea.rows = currentRows
        }
        setTextareaContentRows(currentRows);
    };

    return (
        <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={value}
            onChange={handleTextAreaChange}
            rows={textareaContentRows}
        />
    );
}