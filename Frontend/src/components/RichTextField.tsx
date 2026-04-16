import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import DefaultButton from './DefaultButton'

type MenuItem = {
    icon?: string
    label?: string
    action?: string
    isActiveName?: string | Record<string, any>
    options?: any
    activeOptions?: any
    type?: 'divider'
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) return null

    const activeStyle = 'bg-[#024C89] text-white'
    const defaultStyle = 'text-[#4A4A4A] hover:bg-[#DDE2E5]'
    const buttonClass =
        'w-8 h-8 flex items-center justify-center rounded transition-colors'

    const buttons: MenuItem[] = [
        {
            icon: 'format_bold',
            label: 'Bold',
            action: 'toggleBold',
            isActiveName: 'bold',
        },
        {
            icon: 'format_italic',
            label: 'Italic',
            action: 'toggleItalic',
            isActiveName: 'italic',
        },
        {
            icon: 'format_underlined',
            label: 'Underline',
            action: 'toggleUnderline',
            isActiveName: 'underline',
        },
        {
            icon: 'strikethrough_s',
            label: 'Strikethrough',
            action: 'toggleStrike',
            isActiveName: 'strike',
        },
        { type: 'divider' },
        {
            icon: 'format_list_bulleted',
            label: 'Bullet List',
            action: 'toggleBulletList',
            isActiveName: 'bulletList',
        },
        {
            icon: 'format_list_numbered',
            label: 'Numbered List',
            action: 'toggleOrderedList',
            isActiveName: 'orderedList',
        },
        {
            icon: 'format_quote',
            label: 'Quote',
            action: 'toggleBlockquote',
            isActiveName: 'blockquote',
        },
        { type: 'divider' },
        {
            icon: 'format_align_left',
            label: 'Align Left',
            action: 'setTextAlign',
            options: 'left',
            isActiveName: { textAlign: 'left' },
        },
        {
            icon: 'format_align_center',
            label: 'Align Center',
            action: 'setTextAlign',
            options: 'center',
            isActiveName: { textAlign: 'center' },
        },
        {
            icon: 'format_align_right',
            label: 'Align Right',
            action: 'setTextAlign',
            options: 'right',
            isActiveName: { textAlign: 'right' },
        },
    ]

    return (
        <div className="flex flex-wrap gap-1 border-b-2 border-[#DDE2E5] p-2 bg-gray-50 rounded-t-[14px] items-center">
            {buttons.map((btn, index) => {
                if (btn.type === 'divider') {
                    return (
                        <div
                            key={`div-${index}`}
                            className="w-[1px] h-5 bg-[#DDE2E5] mx-1"
                        ></div>
                    )
                }

                const isActive = btn.activeOptions
                    ? editor.isActive(btn.isActiveName, btn.activeOptions)
                    : editor.isActive(btn.isActiveName)

                return (
                    <DefaultButton
                        key={`${btn.action}-${index}`}
                        type="button"
                        title={btn.label}
                        aria-label={btn.label}
                        onClick={() => {
                            const commandChain = editor.chain().focus() as any
                            const actionName = btn.action as string

                            if (btn.options) {
                                commandChain[actionName](btn.options).run()
                            } else {
                                commandChain[actionName]().run()
                            }
                        }}
                        className={`${buttonClass} ${isActive ? activeStyle : defaultStyle}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {btn.icon}
                        </span>
                    </DefaultButton>
                )
            })}

            <div className="w-[1px] h-5 bg-[#DDE2E5] mx-1"></div>
            <div className="flex items-center gap-1 text-sm text-[#4A4A4A]">
                <label
                    className="flex items-center gap-1 cursor-pointer hover:bg-[#DDE2E5] p-1 rounded"
                    title="Text Color"
                >
                    <span className="material-symbols-outlined text-[20px]">
                        format_color_text
                    </span>
                    <input
                        type="color"
                        onInput={(event: any) =>
                            editor
                                .chain()
                                .focus()
                                .setColor(event.target.value)
                                .run()
                        }
                        value={
                            editor.getAttributes('textStyle').color || '#000000'
                        }
                        className="w-5 h-5 p-0 border-0 rounded cursor-pointer"
                    />
                </label>
                <label
                    className="flex items-center gap-1 cursor-pointer hover:bg-[#DDE2E5] p-1 rounded"
                    title="Highlight Color"
                >
                    <span className="material-symbols-outlined text-[20px]">
                        format_ink_highlighter
                    </span>
                    <input
                        type="color"
                        onInput={(event: any) =>
                            editor
                                .chain()
                                .focus()
                                // Use setHighlight and pass the color inside an object
                                .setHighlight({ color: event.target.value })
                                .run()
                        }
                        value={
                            editor.getAttributes('highlight').color || '#ffffff'
                        }
                        className="w-5 h-5 p-0 border-0 rounded cursor-pointer"
                    />
                </label>
            </div>
        </div>
    )
}

interface RichTextFieldProps {
    label: string
    value: string
    onChange: (value: string) => void
    description?: React.ReactNode
    className?: string
}

function RichTextField({
    label,
    value,
    onChange,
    description,
    className = '',
}: RichTextFieldProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Subscript,
            Superscript,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: 'prose max-w-none focus:outline-none min-h-[150px] p-3 text-[#4A4A4A]',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
    })

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value)
        }
    }, [value, editor])

    return (
        <div className={`flex flex-col gap-1 w-full ${className}`}>
            <div className="flex flex-col gap-1">
                <span className="font-medium text-[#121212]">{label}</span>

                <div className="flex flex-col bg-[#F8F9FA] border-2 border-[#DDE2E5] rounded-[16px] focus-within:border-[#024C89] transition-colors overflow-hidden max-w-2xl">
                    <MenuBar editor={editor} />
                    <EditorContent editor={editor} />
                </div>
            </div>

            {description && (
                <div className="text-[13px] text-[#4A4A4A] mt-1">
                    {description}
                </div>
            )}
        </div>
    )
}

export default RichTextField
