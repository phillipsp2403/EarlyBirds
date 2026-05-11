# Early Birds

This is project is to build a complete app with database and front end to help manage my golfing group, to be known as the Early Birds Portal.

There is an existing app that is built using AirTable as the back end with a MiniExtensions Portal as the front end.  The existing app works reasonably well, but it has a few drawbacks including:
- Relatively expensive to run due to subscriptions for AirTable and MiniExtensions as well as another tool, CraftMyPDF which is used to generate pdf files of a weekly draw to be emailed to members
- The database design is a little ugly due to the fact that AirTable is not a proper relational database
- The front end is not very modern looking and has a number of limitations due to limitations on what can be done with MiniExtensions

I want to redevelop the app using SupaBase as the back end with a modern javascript-based responsive front end.

The purpose of the system is to manage a database of approximately 100 golfers (known as Members), to generate Draws for Events and record the Results from each Event.  Various statistics and summary information for each Member is able to be derived from the Draws and Results.  In addition, there is an Announcements function (that emails announcements to members) and a document storage function, where documents of interest to members can be found.

A simplified schema that I have exported from the existing system can be found in the Google Sheet that I have shared at https://docs.google.com/spreadsheets/d/1IczqvJkd-MZQajXRh1Weg5VDJKwhPsP35AzrBVOOcnc/edit?usp=sharing.

Here is a brief description of each of the tables in the database.

1. Members Table
This is a table that stores data about each Member.  There is common information such as name, phone number(s) and email address, information about what access the Member has to the system and various statistics derived from their Draws and Results.  There are three classes of Member.  An Administrator has full access to the system and manages the database (add/update/delete for all tables).  A RunDown Member enters scores (Results) for Events after each golf game (Event).  All Members may register to participate in Events (through the Red Book table) and view certain documents.

2. Events Table
This is a table that stores data about each golf game (Event).  Members register through the Portal to play in Events via the Red Book table.  They may register up to 16 days before each Event, at which time, a Draw will be generated for the Event.

3. Red Book Table
This table is used to allow Members to register to play in each Event.  The Draw for each Event is generated from the Members who register for the Event via the Red Book.

4. Draws
Sixteen days prior to each Event, a Draw is generated for the Event from the Members who have registered to play in the Red Book table.  A Draw consists of sets of up to either four or six players (depending on whether the Event is a normal four-player or a six-player Event).  The groups are allocated so that no group has less than three players.  Each group is allocated a tee time and start tee, using information from the Events table.  One of the Members in each group is the Booker for the group, which means that they are responsible for booking their group's tee time on the golf club's website.
The algorithm that generates each Draw must try to optimise for three parameters, being:
- Priority One: Bookers are allocated so as to fairly distribute the booking load during the year
- Priority Two: When the Event Course is Pines, ensuring that each Member is allocated to start on the first tee (as opposed to the tenth tee) as close to fifty percent of the time as possible
- Priority Three: Have each Member play with as many different other Members as possible over the course of a year, i.e., minimise the number of times that each Member plays with other Members in the same group

5. Playing Partners
This table records the number of times that each Member has been drawn to play with each other Member, from the Draws table.  It is used when generating a new Draw, as part of the Draw algorithm, to minimise the number of times that each Member plays with each other Member (or to put it another way, to have each Member play with as many of the other Members as possible over the course of a year).

6. Results
This table is used to record the results (scores) for each Event and to keep a record of which Members actually play in each Event, as opposed to who was drawn to play in each Event, as the players may change between the time that the Draw is generated and the Event is played.

7. Announcements
This table is used to generate announcements that are emailed to Members.  Announcements may be sent to all Members, a specific subset of Members of a single Member.

8. Documents
This table is used to hold documents that are accessible to Members, depending on the type of each Document and the class of each Member.