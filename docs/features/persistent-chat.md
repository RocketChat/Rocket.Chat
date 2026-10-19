# Persistent chat

A call's conversation outlives the call. What is said while people are talking is worth keeping, and what is
said afterwards belongs with it — so a conference is attached to a chat that stays readable once everyone has
gone, and that anyone who was in the call can come back to.

This is the model, not the mechanism. Names of functions, settings and constants are deliberately absent — read
the code for those. For the conference itself — who belongs to it, how it ends, how its chat is reached — see
[video conferences](video-conference.md).

## Where the chat lives

A call's chat is the room the call started in, or a discussion the chat was moved to. Which of the two it is
can change while the call runs, and every participant's window follows it.

That the chat may be unreadable to some of the people in the call is the whole difficulty, and it is covered
under [chat access](video-conference.md#chat-access): membership of a call grants no room access, so someone
brought in from outside takes part without seeing a word of it. Two remedies, each giving something away.

## Bringing people in

The same two remedies answer two different questions, and the difference matters.

Asked about **nobody in particular**, they resolve a situation the call has got itself into: some members cannot
read the chat, and the caller picks how to fix that. This is what the notice in the call window offers.

Asked about **named people**, they are how somebody new is brought into the conversation. Whether anyone was
already locked out is beside the point — these people are being given the chat, so there is nothing to work out
and no reason to decline when everybody present can already read it.

Membership and readership stay separate throughout. Being added to a call is what lets someone walk into it;
it puts them in no room, and giving them the chat is a second thing that may or may not be wanted.

### Moving the chat more than once

A discussion is built from the room the chat is in now, not from the room the call started in — otherwise the
second move would be derived from the original room and quietly drop everyone added by the first.

But the original room is read as well, because it has not stood still either: someone who joined it after the
first move is part of the conversation, and a discussion built only from the previous one would leave them
behind. Both, then, and the people being added on top.

## Reaching a call by telephone

A conference can be given a number, so that a desk phone with no idea what Rocket.Chat is can dial into it.

The number is short, which is what makes it dialable and what decides everything else about it. There are not
many of them, so a number is **borrowed rather than owned**: it is released the moment its call reaches an end,
and handed out again to some later conference. Two live calls never share one; a number and a call that has
finished have nothing to do with each other. Nothing may treat it as a way to refer to a call after the fact.

Because the two are told apart by shape — a call's own identifier could never be mistaken for one of these —
the endpoints the provider itself calls take either, and answer about the same conference.

### A call that does not exist yet

A number can be handed out before there is anything behind it. An invitation names one, and whoever dials first
brings the conference into being; everyone after them joins what they found. So asking about a number is
inseparable from creating one, and asking twice would be asking for two conferences rather than the one.

Someone arriving this way has no room in mind — they dialled a number, not a channel — so the workspace names a
room in advance for such calls to hang from, and their chat is a discussion off it. Without one named, there is
nowhere to put the call and the request is refused rather than guessed at.

Nobody is rung. Whoever dials the number is arriving of their own accord, which is not the same as being asked
to answer.

### Who arrived over what

Arrivals are counted as the provider reports them, and kept apart by how they came: over the telephone network,
or over the web. Only arrivals count — a leg the conference placed itself is the call reaching out, not somebody
walking in.

The counts are a record rather than a control: nothing is refused on the strength of one, and a count that
cannot be attributed to a conference is reported and dropped. Being counted is never allowed to hold up the
acknowledgement the provider is waiting for.

## A provider that hosts the call surface

Some providers render the call inside a frame of their own and draw their own controls in it, including a
control for this very chat. Where that happens the window gives its own up — two chat buttons beside each other
is one too many — and takes it back the moment the provider's toolbar is gone, which is to say before anyone has
connected and after they drop out.

A provider that cannot be told which camera or microphone to use has nothing to ask about before the call, so
nothing is asked: the screen that exists to collect those choices would be a single button between the reader
and the call they just opened. They walk straight in.

For such a call the chat is not an afterthought but the reason for opening the call here rather than at the
provider's own address, so it is open on arrival, and sits on the side the reader reads from.

Dropping out of a call leaves a window with nothing much in it. Rather than closing it from under them, the
window offers a few seconds and a way to stay — someone who means to walk back in would rather not lose the
chat beside it.

## The history of a room's calls

A room keeps a list of the calls held in it, split between the ones still running and the ones that have
finished, because the two afford different things: one is something to walk into, the other something to read.

A call is listed by the name of its chat and the last thing said there, rather than by whoever started it —
which is what makes the list worth opening. Failing a chat of its own it falls back to the name the call was
given, and failing that to the name such a chat would have had.

The list answers for a discussion as readily as for the room a call started in. A member brought in from
outside may have no access to that room at all, and a list that only matched it would hide their own call from
them.
