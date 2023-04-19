---
title: "Det där med esoteriska programmeringsspråk"
category: 36
order: 4
author: "Niklas"
---

**Dyk in i en värld där man programmerar i svårlästa, esoteriska syntax, inte för att det är praktiskt, utan bara för att man kan.**

När ett programmeringsspråk skapas brukar dess syfte vara att uppfylla någon sorts behov. Assembly var (i princip) världens första programmeringsspråk, för det är jobbigt att bokstavligen skriva varenda etta och nolla för maskinkoden. Erlang utvecklades med mål att parallellisera exekveringen så mycket som möjligt, för att Ericsson ska kunna slå ut sina konkurrenter. SQL är till för att hantera databaser, Pythons fokuserade på att göra sin syntax extra läsbar och lättförståelig (numera kallas sådana språk för högnivåspråk), och basically allt om C++:s uppkomst och design är ett mysterium än idag. Det finns mycket av både gott och ont att säga om varenda programmeringsspråk, men man kan enas om att alla språk var skapade till att vara bra på någonting praktiskt.

…sedan har vi esoteriska programmeringsspråk, också känt som esolang: språk som var uppfunna som utmaningar eller proof-of-concept, men framförallt brukar syftet med sådana skapelser vara främst underhållning, sällan praktisk tillämpning. (Ordet esoterisk betyder att den bara är avsedd till ett begränsat antal människor – som en inside joke, alltså.) I Whitespace använder man endast osynliga karaktärer som mellanslag, och i Chef skriver man matlagningsrecept som också går att kompileras på en dator. Kanalisera din inre Konfucius genom att programmera i Wenyan vars syntax är klassisk kinesiska med perfekt autentisk grammatik från flera tusen år tillbaka, eller bli den nästa legendariske dramatikern genom att skriva teaterstycke-slash-datorprogram i Shakespeare Programming Language (take notes, herr manuschef af Metaspexet). Vi är högst ärade att i denna artikel få presentera Shakespeares mest kända verk, Do Not Adieu, bättre känd i dagens litteratur som Hello, World!:

```
Do Not Adieu, a play in two acts.

Romeo, a young man with a remarkable patience.
Juliet, a likewise young woman of remarkable grace.
Ophelia, a remarkable woman much in dispute with Hamlet.
Hamlet, the flatterer of Andersen Insulting A/S.

                    Act I: Hamlet's insults and flattery.

                    Scene I: The insulting of Romeo.

[Enter Hamlet and Romeo]

Hamlet:
 You lying stupid fatherless big smelly half-witted coward!
 You are as stupid as the difference between a handsome rich brave
 hero and thyself! Speak your mind!

 You are as brave as the sum of your fat little stuffed misused dusty
 old rotten codpiece and a beautiful fair warm peaceful sunny summer's
 day. You are as healthy as the difference between the sum of the
 sweetest reddest rose and my father and yourself! Speak your mind!

 You are as cowardly as the sum of yourself and the difference
 between a big mighty proud kingdom and a horse. Speak your mind.

 Speak your mind!

[Exit Romeo]

                    Scene II: The praising of Juliet.

[Enter Juliet]

Hamlet:
 Thou art as sweet as the sum of the sum of Romeo and his horse and his
 black cat! Speak thy mind!

[Exit Juliet]

                    Scene III: The praising of Ophelia.

[Enter Ophelia]

Hamlet:

 Thou art as beautiful as the difference between Romeo and the square
 of a huge green peaceful tree. Speak thy mind!

 Thou art as lovely as the product of a large rural town and my amazing
 bottomless embroidered purse. Speak thy mind!

 Thou art as loving as the product of the bluest clearest sweetest sky
 and the sum of a squirrel and a white horse. Thou art as beautiful as
 the difference between Juliet and thyself. Speak thy mind!

[Exeunt Ophelia and Hamlet]

                    Act II: Behind Hamlet's back.

                    Scene I: Romeo and Juliet's conversation.

[Enter Romeo and Juliet]

Romeo:
 Speak your mind. You are as worried as the sum of yourself and the
 difference between my small smooth hamster and my nose. Speak your
 mind!

Juliet:
 Speak YOUR mind! You are as bad as Hamlet! You are as small as the
 difference between the square of the difference between my little pony
 and your big hairy hound and the cube of your sorry little
 codpiece. Speak your mind!

[Exit Romeo]

                    Scene II: Juliet and Ophelia's conversation.

[Enter Ophelia]

Juliet:
 Thou art as good as the quotient between Romeo and the sum of a small
 furry animal and a leech. Speak your mind!

Ophelia:
 Thou art as disgusting as the quotient between Romeo and twice the
 difference between a mistletoe and an oozing infected blister! Speak
 your mind!

[Exeunt]
```

Sannerligen en poet, Shakespeare var. Jag kan skriva en 800-sidig litterär analys om detta genialiska mästerverk, men dBuggen har tyvärr inte nog med budget för att trycka hela analysen, för vi har spenderat allt på rättigheten till att publicera pjäsen i sin helhet.

Att försöka få ihop fungerande program i esolang är ett hobby för de coola kidsen som tycker högstadiematten är för lätt, men alla esolang behöver inte vara rent lidande, utan ofta bara som intressanta, underhållande change-of-pace. Detsamma kan inte sägas om Brainfuck, antagligen den mest kända av alla esolang.

Många har säkert redan hört talas om Brainfuck, ett minimalt men (mot all förnuft) Turingkomplett språk som har blivit legendariskt tack vare hur frustrerande och hemsk det är att programmera i. Språket skapades i 1993 av schweizaren Urban Müller med mål att implementera den minsta möjliga kompilatorn. Resultatet var en binärfil på 240 bytes som kördes på Amiga, och själva språket innehåller endast 8 instruktioner, representerad som 8 ASCII-tecken: < och > är till för att flytta en pointer fram eller tillbaka, + och - är till för att öka eller minska värdet av variabeln vid pointern, punkt och kommatecken är för input/output, och hakparenteserna markerar start och slut för while-loopar (vars enda villkor är att pointern pekar på ett variabel som inte är noll). Alla andra tecken behandlas som kommentarer och ignoreras av kompilatorn.


En gång försökte jag programmera i Brainfuck. Det tog mig 3 månader och en hel del viljekraft att få ihop någonting begripligt. Trots frustrationen kan jag säga att det var en intressant utmaning. Tillslut hade jag Conway’s Game of Life i Brainfuck:

```brainfuck
>>>>>,>++++++[<-------->-]<[>++++++++++<-]>>,>++++++[<-------->-]<<[>+<-]>>>,>++++++[<-------->-]<[>++++++++++<-]<,>++++++[<-------->-]>[<<+>>-]<<[<<<+>>>-]<<<[>+>>+<<<-]<<++++[>++++++++<-]>[<+++<+>>-]<<.>>>>>>[[>>>>>>>>>+<<<<<<<<<-]>>>>>>>>>-<<<<<<<<<<[>>>>>>>>>+<<<<<<<<<-]<[>>>>>>>>>+<<<<<<<<<-]>>>>>>++++[>++++++++<-]>[<+++<+>>-]<<.>>>>>>]<[>>>>>>>>>+<<<<<<<<<-]<[>>>>>>>>>+<<<<<<<<<-]>>>>>>++++[>++++++++<-]>[<+++<+>>-]<<.<++++++++++.>>>>>>[[>>>>>>>>>+<<<<<<<<<-]>>>>>>>>>-<<<<<<<<<<[>>>>>>>>>+<<<<<<<<<-]>>>>>>++++[>++++++++<-]>[<+++<+>>-]<<.>>>>[<+>-]<[>+>>+<<<-]>>>>>>>,<<<<[[>>>>>>>>>+<<<<<<<<<-]>>>>>>>>>-<<<<<<<<<<[>>>>>>>>>+<<<<<<<<<-]<[>>>>>>>>>+<<<<<<<<<-]>>>>>>,>[-]>[-]++++[<++++++++++>-]<+[<->-]<[>++++++++++++++++<-]++++[>>++++++++<<-]>>[<<+>>-]<[<+>-]<.>>>[<+>-]<[<<<<<+>>>>>>+<-]>>>]<[>>>>>>>>>+<<<<<<<<<-]<[>>>>>>>>>+<<<<<<<<<-]>>>>>>++++[>++++++++<-]>[<+++<+>>-]<<.<++++++++++.>>>>>>]<[<+>-]<[>+>>+<<<-]>[>>>>>>>>>+<<<<<<<<<-]>>[>>>>>>>>>+<<<<<<<<<-]>>>>++++[>++++++++<-]>[<+++<+>>-]<<.>>>>>>[[>>>>>>>>>+<<<<<<<<<-]>>>>>>>>>-<<<<<<<<<<<[>>>>>>>>>+<<<<<<<<<-]>>>>>>++++[>++++++++<-]>[<+++<+>>-]<<.>>>>>>]<<[>>>>>>>>>+<<<<<<<<<-]>>>>>>++++[>++++++++<-]>[<+++<+>>-]<<.<++++++++++.>>>>>[>+>+<<-]>>[<<<<<[<<<<<<<<<]>>>>>>>>>[<<<<[-]<[-]>>[<<+>+>-]<<[>>+<<-]+>[>>[-]>>>[-]>[-]>[-]<<<<<<[>>>>+>+>+<<<<<<-]>>>>>>[<<<<<<+>>>>>>-]<+++<+++[[<<<<<<<<<+>>>>>>>>>-]>[<<<<<<<<<+>>>>>>>>>-]<<<<<<<<<<-]<[>+>>+<<<-]>>>[<<<+>>>-]<[[>>>>>>>>>+<<<<<<<<<-]<[>>>>>>>>>+<<<<<<<<<-]>>>>>>>>>>-]<[>+<--------------------------------]>--[<<<<+>>>>-][-]>[-]<<[-]<<<<[>>>>+>+>+<<<<<<-]>>>>>>[<<<<<<+>>>>>>-]<++<++[[<<<<<<<<<+>>>>>>>>>-]>[<<<<<<<<<+>>>>>>>>>-]<<<<<<<<<<-]<[>+>>+<<<-]>>>[<<<+>>>-]<[[>>>>>>>>>+<<<<<<<<<-]<[>>>>>>>>>+<<<<<<<<<-]>>>>>>>>>>-]<[>+<--------------------------------]>--[<<<<+>>>>-][-]>[-]<<[-]<<<<[>>>>+>+>+<<<<<<-]>>>>>>[<<<<<<+>>>>>>-]<+<+[[<<<<<<<<<+>>>>>>>>>-]>[<<<<<<<<<+>>>>>>>>>-]<<<<<<<<<<-]<[>+>>+<<<-]>>>[<<<+>>>-]<[[>>>>>>>>>+<<<<<<<<<-]<[>>>>>>>>>+<<<<<<<<<-]>>>>>>>>>>-]<[>+<--------------------------------]>--[<<<<+>>>>-][-]>[-]<<[-]<<<<<<<<<<[>+>>>>>>>>>+<<<<<<<<<<-]>[<+>-]>>>>>>>>>[>+<--------------------------------]>--[<<<<+>>>>-][-]>[-]<<[-]>>>>>>>>[>+<<<<<<<<<+>>>>>>>>-]>[<+>-]<<<<<<<<<[>+<--------------------------------]>--[<<<<+>>>>-][-]>[-]<<[-]<<<<[>>>>+>+>+<<<<<<-]>>>>>>[<<<<<<+>>>>>>-]<+<+[[>>>>>>>>>+<<<<<<<<<-]>[>>>>>>>>>+<<<<<<<<<-]>>>>>>>>-]<[>+>>+<<<-]>>>[<<<+>>>-]<[[<<<<<<<<<+>>>>>>>>>-]<[<<<<<<<<<+>>>>>>>>>-]<<<<<<<<-]<[>+<--------------------------------]>--[<<<<+>>>>-][-]>[-]<<[-]<<<<[>>>>+>+>+<<<<<<-]>>>>>>[<<<<<<+>>>>>>-]<++<++[[>>>>>>>>>+<<<<<<<<<-]>[>>>>>>>>>+<<<<<<<<<-]>>>>>>>>-]<[>+>>+<<<-]>>>[<<<+>>>-]<[[<<<<<<<<<+>>>>>>>>>-]<[<<<<<<<<<+>>>>>>>>>-]<<<<<<<<-]<[>+<--------------------------------]>--[<<<<+>>>>-][-]>[-]<<[-]<<<<[>>>>+>+>+<<<<<<-]>>>>>>[<<<<<<+>>>>>>-]<+++<+++[[>>>>>>>>>+<<<<<<<<<-]>[>>>>>>>>>+<<<<<<<<<-]>>>>>>>>-]<[>+>>+<<<-]>>>[<<<+>>>-]<[[<<<<<<<<<+>>>>>>>>>-]<[<<<<<<<<<+>>>>>>>>>-]<<<<<<<<-]<[>+<--------------------------------]>--[<<<<+>>>>-][-]>[-]<<[-]++++++++<<<[>>>-<<<-]>>>[<<<+>>>-]<<[-]++>>[-]++>[-]+++>[-]++++<<<<<[->>>->>>[-]>[-]<<<<[>>>+>+<<<<-]>>>[<<<+>>>-]+>[<->[-]]<[<<<<<-->>>>>-]<<->>[-]>[-]<<<[>>+>+<<<-]>>[<<+>>-]+>[<->[-]]<[<<<<<+>>>>>-]<->[-]>[-]<<[>+>+<<-]>[<+>-]+>[<->[-]]<[<<<<<+>>>>>-]<<<<<<]>>>[-]>[-]>[-]<<<<<<<<->[-]]<[-]>>>>>>>>>>>>>>]<<<<<<<<<[<<<<<<<<<]>>>>>>>>>[<<<<[-]<[-]>>[<<+>+>-]<<[>>+<<-]+>[>>>>>>>>[-]>[-]<<<<<<[>>>>>+>+<<<<<<-]>>>>>[<<<<<+>>>>>-]+>[<<<<<[-]<[>++++++++++++++++++++++++++++++++<-]>++++++++++++++++++++++++++++++++>>>>->[-]]<[-]<<<<.<<<<<->[-]]<[>>>>.<.<<<-]>>>>>>>>>>>>>>]<<<<]
```

Se alla 3630 karaktärer och testkör programmet [https://dsekt.se/brainfuck](https://dsekt.se/brainfuck).