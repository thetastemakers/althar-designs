import Record from './Record/Record.jsx'
import Console from './Console/Console.jsx'
import Address from './Address/Address.jsx'
import Standup from './Standup/Standup.jsx'
import Rooms from './Rooms/Rooms.jsx'

export const DIRECTIONS = [
  {
    id: 'record',
    n: 1,
    name: 'Record',
    line: 'The project is one continuous record. Navigation is temporal, not spatial.',
    Component: Record,
    thesis: [
      ['Assumes', 'Users model the project as an accumulating history — what happened, in what order, and why.'],
      ['Always visible', 'The record itself, what is executing right now, and the line you use to speak to the project.'],
      ['Deliberately hidden', 'Destinations. There are no sections, only lenses over a single stream.'],
      ['Starting work', 'You write into the record. Intent becomes the first entry of its own execution.'],
      ['Principal cost', 'Structured browsing. Recalling a specific piece of knowledge means searching, not navigating.'],
    ],
  },
  {
    id: 'console',
    n: 2,
    name: 'Console',
    line: 'The project is a running machine. The shell is a supervisory instrument with three persistent zones.',
    Component: Console,
    thesis: [
      ['Assumes', 'Users model the project as live execution they are responsible for, the way an operator watches a system.'],
      ['Always visible', 'Every active graph, every worker, the attention boundary, and the coordinator.'],
      ['Deliberately hidden', 'History. The past is a destination, not ambient.'],
      ['Starting work', 'You say it to the coordinator, which is docked permanently on the right.'],
      ['Principal cost', 'Horizontal space, and a shell that keeps showing you the machine even when nothing needs you.'],
    ],
  },
  {
    id: 'address',
    n: 3,
    name: 'Address',
    line: 'You do not navigate the project. You address it. The coordinator is the shell.',
    Component: Address,
    thesis: [
      ['Assumes', 'Users model the project as an intelligence that already knows its own state and can be asked.'],
      ['Always visible', 'A written brief of the project’s current state, and one address line.'],
      ['Deliberately hidden', 'Navigation itself. There is no persistent chrome to learn.'],
      ['Starting work', 'You type. The same line that finds things also begins them.'],
      ['Principal cost', 'Discoverability. Nothing advertises what the project can do until you ask.'],
    ],
  },
  {
    id: 'standup',
    n: 4,
    name: 'Standup',
    line: 'The project has a manager. You talk to it, and watch the board it keeps for you.',
    Component: Standup,
    thesis: [
      ['Assumes', 'Users model the project the way they model a team: someone is running it, you talk to them, and there is a board you can look at.'],
      ['Always visible', 'One continuous conversation with the coordinator, and every piece of work in flight.'],
      ['Deliberately hidden', 'The interior of a thread. Work is a card on the board until you open it.'],
      ['Starting work', 'You say it. The coordinator opens a thread and it appears on the board immediately.'],
      ['Principal cost', 'Two surfaces compete for the window, and the project\u2019s memory becomes a scroll.'],
    ],
  },
  {
    id: 'rooms',
    n: 5,
    name: 'Rooms',
    line: 'Three rooms over one project: the conversation, the board, or both. Knowledge and artifacts bolt onto whichever one you are in.',
    Component: Rooms,
    thesis: [
      ['Assumes', 'Talking about the work and watching it are different postures, and which one deserves the window changes through the day.'],
      ['Always visible', 'Which room you are in, how much is running, and whether anything needs you.'],
      ['Deliberately hidden', 'Whatever the current room is not showing. Knowledge and artifacts are never destinations; they are summoned into a dock that follows you between rooms.'],
      ['Starting work', 'You say it in the conversation. The board has it the moment you look.'],
      ['Principal cost', 'A third mode to choose, and an All room dense enough that the dock has to float over it.'],
    ],
  },
]
