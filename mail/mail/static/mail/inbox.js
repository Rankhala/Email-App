document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit handler
  document.querySelector("#compose-form").addEventListener('submit', send_mail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    //Print mail
    console.log(email);

    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#emails-detail-view').style.display = 'block';

    document.querySelector('#emails-detail-view').innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><strong>From: </strong>${email.sender}</li>
        <li class="list-group-item"><strong>To: </strong>${email.recipients}</li>
        <li class="list-group-item"><strong>Subject: </strong>${email.subject}</li>
        <li class="list-group-item"><strong>Time: </strong>${email.timestamp}</li>
        <li class="list-group-item">${email.body}</li>
      </ul>
    `

    //Change the read status to false or true
    if(!email.read){
      fetch(`/emails/${email.id}`,{
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
    }

    //Archive and unchive logic
    // Create an archive and unarchive for each email
    const element = document.createElement('button');
    element.innerHTML = email.archived ? "Unarchived" : "Archived";
    element.className = email.archived ? "btn btn-success" : "btn btn-danger";
    element.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !email.archived
          })
        })
        .then(() => { load_mailbox("archived")})
    });
    document.querySelector('#emails-detail-view').append(element);

    //Reply logic
    const btn_reply = document.createElement('button');
    btn_reply.innerHTML = "Reply";
    btn_reply.className = "btn btn-info";
    btn_reply.addEventListener('click', function() {
      compose_email();

      document.querySelector("#compose-recipients").value = email.sender;
      let subject = email.subject;
      if(subject.split('',1)[0] != 'Re:'){
        subject = "Re: " + email.subject;
      }
      document.querySelector("#compose-subject").value = subject;
      document.querySelector("#compose-body").value = `On ${email.timestamp} ${email.sender} wrote ${email.body}`
    });
    document.querySelector('#emails-detail-view').append(btn_reply);
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show mailbox for a specific user
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Loop through emails and create a div for each
      emails.forEach(email => {

        console.log(email);

        // Create a div for each email
        const element = document.createElement('div');
        element.className = "list-group-item";
        element.innerHTML = `
          <h6>Sender: ${email.sender}</h6>
          <h5>Subject: ${email.subject}</h5>
          <p>${email.timestamp}</p>
        `;
        // Change background colour
        element.className = email.read ? 'read': 'unread';
        //Add click event for viewing an email
        element.addEventListener('click', function() {
            view_email(email.id);
        });
        document.querySelector('#emails-view').append(element);
      })
  });
}

function send_mail(event){
  event.preventDefault();

  // Store the fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });
}


