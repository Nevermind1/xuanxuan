import React, {Component, PropTypes} from 'react';
import {classes, isWebUrl} from '../../utils/html-helper';
import {MessageListItem} from './message-list-item';
import replaceViews from '../replace-views';
import App from '../../core';

class MessageList extends Component {
    static propTypes = {
        messages: PropTypes.array.isRequired,
        stayBottom: PropTypes.bool,
        staticUI: PropTypes.bool,
        showDateDivider: PropTypes.any,
        className: PropTypes.string,
        font: PropTypes.object,
        listItemProps: PropTypes.object,
        children: PropTypes.any,
        listItemCreator: PropTypes.func,
        header: PropTypes.any,
        onScroll: PropTypes.func,
    };

    static defaultProps = {
        showDateDivider: 0,
        stayBottom: true,
        staticUI: false,
        className: null,
        font: null,
        listItemProps: null,
        children: null,
        listItemCreator: null,
        header: null,
        onScroll: null,
    };

    static get MessageList() {
        return replaceViews('chats/message-list', MessageList);
    }

    componentDidMount() {
        this.onChatActiveHandler = App.im.ui.onActiveChat(chat => {
            if (this.lastMessage && (this.waitNewMessage || this.isScrollBottom) && this.lastMessage.cgid === chat.gid) {
                this.waitNewMessage = null;
                this.scrollToBottom(500);
            }
        });
    }

    componentDidUpdate() {
        if (this.props.stayBottom) {
            const {messages} = this.props;
            const newMessage = this.checkHasNewMessages(messages);
            if (newMessage) {
                if (App.im.ui.isActiveChat(newMessage.cgid)) {
                    if (newMessage.isSender(App.profile.userId) || this.isScrollBottom) {
                        this.scrollToBottom(100);
                    }
                } else {
                    this.waitNewMessage = newMessage;
                }
            }
        }
    }

    componentWillUnmount() {
        App.events.off(this.onChatActiveHandler);
    }

    scrollToBottom = () => {
        this.element.scrollTop = this.element.scrollHeight - this.element.clientHeight;
    }

    checkHasNewMessages(messages) {
        const lastMessage = this.lastMessage;
        const thisLastMessage = messages && messages.length ? messages[messages.length - 1] : null;
        this.lastMessage = thisLastMessage;
        if (lastMessage !== thisLastMessage && thisLastMessage && ((!lastMessage && thisLastMessage) || thisLastMessage.date > lastMessage.date || thisLastMessage.id > lastMessage.id)) {
            return thisLastMessage;
        }
        return false;
    }

    checkHasNewOlderMessages(messages) {
        const lastFirstMessage = this.lastFirstMessage;
        const thisFirstMessage = messages && messages.length ? messages[0] : null;
        this.lastFirstMessage = thisFirstMessage;
        if (thisFirstMessage && lastFirstMessage && (thisFirstMessage.date < lastFirstMessage.date || thisFirstMessage.id < lastFirstMessage.id)) {
            return lastFirstMessage;
        }
    }

    handleScroll = e => {
        const target = e.target;
        if (!target.classList.contains('app-message-list')) {
            return;
        }
        const scrollInfo = {
            scrollHeight: target.scrollHeight,
            scrollTop: target.scrollTop,
            target,
            isAtTop: target.scrollTop === 0,
            isAtBottom: (target.scrollHeight - target.scrollTop) === target.clientHeight
        };
        this.scrollInfo = scrollInfo;
        if (this.props.onScroll) {
            this.props.onScroll(scrollInfo, e);
        }
    }

    get isScrollBottom() {
        return this.scrollInfo ? this.scrollInfo.isAtBottom : true;
    }

    handleContextMenu = e => {
        if (e.target.tagName === 'A') {
            const link = e.target.href;
            if (isWebUrl(link)) {
                let linkText = document.getSelection().toString().trim();
                if (linkText === '') {
                    linkText = e.target.innerText || (e.target.attributes.title ? e.target.attributes.title.value : '');
                }
                App.ui.showContextMenu({x: e.pageX, y: e.pageY}, App.ui.createLinkContextMenu(link, linkText));
                e.preventDefault();
            }
        }
    };

    render() {
        const {
            messages,
            className,
            showDateDivider,
            font,
            stayBottom,
            children,
            listItemProps,
            listItemCreator,
            staticUI,
            header,
            onScroll,
            ...other
        } = this.props;

        let lastMessage = null;
        const messagesView = [];
        if (messages) {
            messages.forEach(message => {
                const messageListItem = listItemCreator ? listItemCreator(message, lastMessage) : <MessageListItem id={`message-${message.gid}`} staticUI={staticUI} font={font} showDateDivider={showDateDivider} lastMessage={lastMessage} key={message.gid} message={message} {...listItemProps} />;
                lastMessage = message;
                messagesView.unshift(messageListItem);
            });
        }

        return (<div
            {...other}
            className={classes('app-message-list flex column-reverse', className, {'app-message-list-static': staticUI})}
            onScroll={this.handleScroll}
            onContextMenu={this.handleContextMenu}
            ref={e => {this.element = e;}}
        >
            {messagesView}
            {header}
        </div>);
    }
}

export default MessageList;
